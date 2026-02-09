import { Tag, decode, encode } from 'cbor2'
import { createHash, randomBytes, subtle } from 'crypto'
import * as HPKE from 'hpke'
import { exportJWK } from 'jose'
import { createJwkWithX5c, pemToDer } from '../../../../util/cryptography'
import { invariant } from '../../../../util/invariant'
import { validateMDocResponse } from '../mdoc'
import { mdocEphemeralKeys } from '../shared-config'
import type { EphemeralKeyData, MDocRequestClaimPath, MDocRequestDetails, ProcessedMDocRequestResponse } from '../types'
import { decodeDeviceResponse } from './cborHelpers'

// COSE_Key labels (RFC 9052 / RFC 9053)
const COSE_KEY_TYPE = 1 // kty
const COSE_KEY_TYPE_EC2 = 2 // EC2
const COSE_EC2_CRV = -1 // crv
const COSE_EC2_CRV_P256 = 1 // P-256
const COSE_EC2_X = -2 // x coordinate
const COSE_EC2_Y = -3 // y coordinate

// COSE header labels
const COSE_HEADER_ALG = 1
const COSE_ALG_ES256 = -7
const COSE_HEADER_X5CHAIN = 33

const MDOC_KEYS_CACHE_KEY = 'mdoc:keys'

/**
 * Convert a Buffer to Uint8Array.
 * cbor2 encodes Node.js Buffer as {type:"Buffer",data:[...]} instead of CBOR bstr.
 * All binary data passed to cbor2.encode() MUST be Uint8Array, not Buffer.
 */
function toBytes(input: Buffer | Uint8Array | ArrayBuffer): Uint8Array {
  if (input instanceof ArrayBuffer) return new Uint8Array(input)
  if (input instanceof Buffer) return new Uint8Array(input)
  return input
}

// ── Reader Auth Key (lazily generated, cached for the process lifetime) ──
let readerAuthKeyPromise: Promise<{ privateKey: CryptoKey; certDer: Uint8Array }> | undefined

async function getReaderAuthKey(): Promise<{ privateKey: CryptoKey; certDer: Uint8Array }> {
  if (!readerAuthKeyPromise) {
    readerAuthKeyPromise = (async () => {
      const { privateKey, pemCert } = await createJwkWithX5c({
        alg: 'ECDSA',
        keyUsages: ['sign'],
        subject: { commonName: 'VO mDoc Reader' },
      })
      const certDer = toBytes(pemToDer(pemCert))
      return { privateKey, certDer }
    })()
  }
  return readerAuthKeyPromise
}

/**
 * Build a COSE_Sign1 with detached payload (ISO 18013-5 ReaderAuth).
 *
 * Sig_structure = ["Signature1", protectedHeaders, externalAAD, payload]
 * The final COSE_Sign1 = [protectedHeaders, unprotectedHeaders, nil, signature]
 *
 * Per ISO 18013-5, the payload in the COSE_Sign1 is nil (detached),
 * but the actual data signed is the ReaderAuthenticationBytes.
 */
async function buildCoseSign1Detached(payload: Uint8Array, signingKey: CryptoKey, certDer: Uint8Array): Promise<unknown[]> {
  // Protected headers: { 1: -7 } (alg: ES256)
  const protectedHeadersMap = new Map<number, number>([[COSE_HEADER_ALG, COSE_ALG_ES256]])
  const protectedHeadersBytes = encode(protectedHeadersMap)

  // Sig_structure per RFC 9052 §4.4
  const sigStructure = ['Signature1', protectedHeadersBytes, new Uint8Array(0), payload]
  const sigStructureBytes = encode(sigStructure)

  // Sign with ECDSA P-256 / SHA-256
  const signatureArrayBuffer = await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, signingKey, sigStructureBytes)

  // WebCrypto returns IEEE P1363 format (r || s, 64 bytes for P-256) — this is what COSE expects
  const signature = new Uint8Array(signatureArrayBuffer)

  // Unprotected headers: { 33: certDer } (x5chain)
  const unprotectedHeaders = new Map<number, unknown>([[COSE_HEADER_X5CHAIN, certDer]])

  // COSE_Sign1 as plain array per ISO 18013-5 (no CBOR Tag 18 wrapper)
  return [protectedHeadersBytes, unprotectedHeaders, null, signature]
}

/**
 * Build an ISO 18013-7 Annex C request for the W3C Digital Credential API.
 *
 * This produces two base64url strings:
 *
 * **encryptionInfo** — CBOR array per ISO 18013-7 Annex C:
 * ```
 * EncryptionInfo = ["dcapi", { "nonce": bstr, "recipientPublicKey": COSE_Key }]
 * ```
 *
 * **deviceRequest** — CBOR map per ISO 18013-5:2024 §8.3.2.1 (version 1.1):
 * ```
 * DeviceRequest     = { "version": "1.1", "docRequests": [DocRequest],
 *                       "deviceRequestInfo": Tag24(DeviceRequestInfo),
 *                       "readerAuthAll": [COSE_Sign1] }
 * DocRequest        = { "itemsRequest": Tag24(ItemsRequest), "readerAuth": COSE_Sign1 }
 * ItemsRequest      = { "docType": tstr, "nameSpaces": NameSpaces }
 * DeviceRequestInfo = { "useCases": [UseCase] }
 * UseCase           = { "mandatory": bool, "documentSets": [[docRequestIdx]] }
 * ```
 *
 * Per-doc ReaderAuth signs:
 *   `Tag24(CBOR(["ReaderAuthentication", SessionTranscript, ItemsRequestBytes]))`
 *
 * ReaderAuthAll signs:
 *   `Tag24(CBOR(["ReaderAuthenticationAll", SessionTranscript, [ItemsRequestBytes...], Tag24(DeviceRequestInfo) | null]))`
 */
export async function buildISO18013_7DeviceRequest(
  requestId: string,
  docType: string,
  requestedClaims: MDocRequestClaimPath[],
  origin: string,
): Promise<{ deviceRequest: string; encryptionInfo: string }> {
  // Generate ephemeral ECDH P-256 key pair
  const keyPair = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits'])
  const publicJwk = await exportJWK(keyPair.publicKey)

  // Convert the public key to a COSE_Key (RFC 9052 §7) using integer labels
  // NOTE: cbor2 encodes Buffer as {type:"Buffer",data:[...]} — all binary data must be Uint8Array
  const coseKey = new Map<number, unknown>([
    [COSE_KEY_TYPE, COSE_KEY_TYPE_EC2],
    [COSE_EC2_CRV, COSE_EC2_CRV_P256],
    [COSE_EC2_X, toBytes(Buffer.from(publicJwk.x!, 'base64url'))],
    [COSE_EC2_Y, toBytes(Buffer.from(publicJwk.y!, 'base64url'))],
  ])

  // Build encryptionInfo
  // Per ISO 18013-7 Annex C: ["dcapi", { "nonce": bstr, "recipientPublicKey": COSE_Key }]
  const nonce = toBytes(randomBytes(16))
  const encryptionInfoCbor = [
    'dcapi',
    new Map<string, unknown>([
      ['nonce', nonce],
      ['recipientPublicKey', coseKey],
    ]),
  ]
  const encryptionInfoBytes = encode(encryptionInfoCbor)
  const encryptionInfoBase64 = Buffer.from(encryptionInfoBytes).toString('base64url')

  // Build SessionTranscript (needed for ReaderAuth signing)
  const sessionTranscript = buildDcApiSessionTranscriptArray(encryptionInfoBase64, origin)

  // Group requested claims by namespace
  // path[0] = namespace, path[1] = elementIdentifier
  const nameSpaces = new Map<string, Map<string, boolean>>()
  for (const claim of requestedClaims) {
    const [namespace, elementIdentifier] = claim.path
    if (!namespace || !elementIdentifier) continue
    if (!nameSpaces.has(namespace)) {
      nameSpaces.set(namespace, new Map())
    }
    nameSpaces.get(namespace)!.set(elementIdentifier, claim.intentToRetain ?? false)
  }

  // ItemsRequest → Tag 24 wrapped
  const itemsRequest = new Map<string, unknown>([
    ['docType', docType],
    ['nameSpaces', nameSpaces],
  ])
  const itemsRequestBytes = encode(itemsRequest)
  const taggedItemsRequest = new Tag(24, itemsRequestBytes)

  // Per-doc ReaderAuthentication signature
  const readerAuthentication = ['ReaderAuthentication', sessionTranscript, taggedItemsRequest]
  const readerAuthenticationBytes = encode(new Tag(24, encode(readerAuthentication)))
  const { privateKey: readerPrivateKey, certDer } = await getReaderAuthKey()
  const readerAuth = await buildCoseSign1Detached(readerAuthenticationBytes, readerPrivateKey, certDer)

  const docRequest = new Map<string, unknown>([
    ['itemsRequest', taggedItemsRequest],
    ['readerAuth', readerAuth],
  ])

  // DeviceRequestInfo with useCases (required by iOS 26, optional per spec)
  const deviceRequestInfo = new Map<string, unknown>([
    [
      'useCases',
      [
        new Map<string, unknown>([
          ['mandatory', true],
          ['documentSets', [[0]]],
        ]),
      ],
    ],
  ])
  const deviceRequestInfoTagged = new Tag(24, encode(deviceRequestInfo))

  // ReaderAuthenticationAll — signs over all doc requests + deviceRequestInfo
  const readerAuthenticationAll = ['ReaderAuthenticationAll', sessionTranscript, [taggedItemsRequest], deviceRequestInfoTagged]
  const readerAuthAllBytes = encode(new Tag(24, encode(readerAuthenticationAll)))
  const readerAuthAll = await buildCoseSign1Detached(readerAuthAllBytes, readerPrivateKey, certDer)

  // DeviceRequest v1.1
  const deviceRequest = new Map<string, unknown>([
    ['version', '1.1'],
    ['docRequests', [docRequest]],
    ['deviceRequestInfo', deviceRequestInfoTagged],
    ['readerAuthAll', [readerAuthAll]],
  ])
  const deviceRequestBytes = encode(deviceRequest)
  const deviceRequestBase64 = Buffer.from(deviceRequestBytes).toString('base64url')

  // Store ephemeral private key for response decryption
  const exportedPrivateKey = await subtle.exportKey('pkcs8', keyPair.privateKey)
  const keyData: EphemeralKeyData = {
    encryptionPrivateKey: Buffer.from(exportedPrivateKey).toString('base64'),
    encryptionInfoBase64,
    origin,
    created: Date.now(),
    requestId,
  }
  const keyStorage = mdocEphemeralKeys()
  await keyStorage.set(`${MDOC_KEYS_CACHE_KEY}:${requestId}`, keyData)

  return {
    deviceRequest: deviceRequestBase64,
    encryptionInfo: encryptionInfoBase64,
  }
}

/**
 * Build the ISO 18013-7 Annex C SessionTranscript as a CBOR-encodable array.
 *
 * ```
 * dcapiInfo = [base64url(encryptionInfo), origin]
 * SessionTranscript = [null, null, ["dcapi", SHA-256(CBOR(dcapiInfo))]]
 * ```
 */
function buildDcApiSessionTranscriptArray(encryptionInfoBase64: string, origin: string): unknown[] {
  const dcapiInfo = [encryptionInfoBase64, origin]
  const dcapiInfoDigest = toBytes(createHash('sha256').update(encode(dcapiInfo)).digest())
  return [null, null, ['dcapi', dcapiInfoDigest]]
}

/**
 * Build the ISO 18013-7 Annex C SessionTranscript as CBOR-encoded bytes.
 * Used for response validation where the encoded form is needed.
 */
export function buildDcApiSessionTranscript(encryptionInfoBase64: string, origin: string): Uint8Array {
  return encode(buildDcApiSessionTranscriptArray(encryptionInfoBase64, origin))
}

/**
 * Decode and validate an ISO 18013-7 Annex C (org-iso-mdoc) response.
 *
 * The response from the wallet is an HPKE-encrypted CBOR structure:
 * ```
 * EncryptedResponse = ["dcapi", { "enc": bstr, "cipherText": bstr }]
 * ```
 *
 * Decryption uses DHKEM(P-256, HKDF-SHA256), HKDF-SHA256, AES-128-GCM
 * with `info = CBOR(SessionTranscript)` and empty AAD.
 *
 * The plaintext is a CBOR-encoded DeviceResponse (same structure as OpenID4VP vp_token).
 */
export async function decodeAndValidateISO18013_7Response(
  { requestId, docType }: MDocRequestDetails,
  encodedResponse: string,
): Promise<ProcessedMDocRequestResponse> {
  // Retrieve the ephemeral private key and session transcript params
  const keyStorage = mdocEphemeralKeys()
  const keyData = await keyStorage.get(`${MDOC_KEYS_CACHE_KEY}:${requestId}`)
  invariant(keyData, `Ephemeral key for request "${requestId}" not found or expired`)
  invariant(keyData.encryptionInfoBase64, 'encryptionInfoBase64 missing from cached key data')

  // Decode the encrypted response CBOR
  // EncryptedResponse = ["dcapi", { "enc": bstr, "cipherText": bstr }]
  const encryptedResponseBytes = Buffer.from(encodedResponse, 'base64url')
  const encryptedResponse = decode(new Uint8Array(encryptedResponseBytes)) as unknown[]
  invariant(Array.isArray(encryptedResponse) && encryptedResponse[0] === 'dcapi', 'Invalid encrypted response: expected ["dcapi", ...]')

  const encResponsePayload = encryptedResponse[1]
  invariant(typeof encResponsePayload === 'object' && encResponsePayload !== null, 'Invalid encrypted response payload')
  invariant('enc' in encResponsePayload && encResponsePayload.enc instanceof Uint8Array, 'Missing enc in encrypted response')
  invariant(
    'cipherText' in encResponsePayload && encResponsePayload.cipherText instanceof Uint8Array,
    'Missing cipherText in encrypted response',
  )
  const responseMap = encResponsePayload as { enc: Uint8Array; cipherText: Uint8Array }

  // Rebuild the session transcript for HPKE info parameter
  const sessionTranscriptCbor = buildDcApiSessionTranscript(keyData.encryptionInfoBase64, keyData.origin ?? '')

  // Import the ephemeral private key
  const privateKeyBuffer = Buffer.from(keyData.encryptionPrivateKey, 'base64')
  const importedPrivateKey = await subtle.importKey('pkcs8', privateKeyBuffer, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])

  // Export as JWK to extract the raw `d` value for HPKE
  const privateJwk = await subtle.exportKey('jwk', importedPrivateKey)
  invariant(privateJwk.d, 'Private key JWK missing d parameter')
  const rawD = new Uint8Array(Buffer.from(privateJwk.d, 'base64url'))

  // HPKE decrypt
  // Cipher suite: DHKEM(P-256, HKDF-SHA256), HKDF-SHA256, AES-128-GCM
  const suite = new HPKE.CipherSuite(HPKE.KEM_DHKEM_P256_HKDF_SHA256, HPKE.KDF_HKDF_SHA256, HPKE.AEAD_AES_128_GCM)

  // Import the recipient private key from raw d value (must be extractable for HPKE)
  const recipientPrivateKey = await suite.DeserializePrivateKey(rawD, true)

  // Decrypt: enc = encapsulated public key, cipherText = encrypted data
  const plaintext = await suite.Open(recipientPrivateKey, responseMap.enc, responseMap.cipherText, {
    info: sessionTranscriptCbor,
    aad: new Uint8Array(0),
  })
  const decryptedAt = new Date()

  // Decode the DeviceResponse from the decrypted CBOR
  const deviceResponseBase64 = Buffer.from(plaintext).toString('base64url')
  const mDocDeviceResponse = decodeDeviceResponse(deviceResponseBase64)

  // Validate the mDoc response
  const validationResults = await validateMDocResponse(mDocDeviceResponse, docType, decryptedAt)

  // Clean up the ephemeral key after successful decryption
  await keyStorage.delete(`${MDOC_KEYS_CACHE_KEY}:${requestId}`)

  return {
    mDocDeviceResponse,
    diagnostics: {
      validation: validationResults,
      response: JSON.stringify({ protocol: 'org-iso-mdoc', decryptedAt }),
      deviceResponse: JSON.stringify(mDocDeviceResponse),
    },
  }
}
