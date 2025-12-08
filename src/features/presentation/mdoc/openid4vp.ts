import { decode, type ITag, type TagDecoder, type TagNumber } from 'cbor2'
import { randomBytes, subtle } from 'crypto'
import type { JWK } from 'jose'
import { CompactSign, exportJWK, jwtDecrypt } from 'jose'
import { computeX509Hash, createJwkWithX5c } from '../../../util/cryptography'
import { invariant } from '../../../util/invariant'
import { validateMDocResponse } from './mdoc'
import { MDOC_TTL, mdocEphemeralKeys } from './shared-config'
import {
  mDocResponseStatus,
  type EphemeralKeyData,
  type MDocDeviceResponse,
  type MDocDocument,
  type MDocIssuerSigned,
  type MDocNamespaceItem,
  type MDocRequestClaimPath,
  type MDocRequestDetails,
  type MDocResponseStatus,
  type ProcessedMDocRequestResponse,
} from './types'

// OpenID4VP, A.1 https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#appendix-A.1
type OpenID4VPProtocol = 'openid4vp-v1-unsigned' | 'openid4vp-v1-signed' | 'openid4vp-v1-multisigned'

type OpenId4VpRequestEncBase = {
  response_type: 'vp_token'
  response_mode: 'dc_api.jwt'
  nonce: string
  dcql_query: {
    credentials: {
      id: string
      format: 'mso_mdoc'
      multiple?: boolean
      meta: {
        doctype_value: string
      }
      claims: {
        path: string[]
        intent_to_retain?: boolean
      }[]
    }[]
    // OpenID4VP, 6.2, A Credential Set
    credential_sets?: {
      options: string[]
      required?: boolean // Defaults to true
    }[]
  }
  client_metadata: {
    encrypted_response_enc_values_supported?: ('A128GCM' | 'A256GCM')[]
    jwks: {
      keys: JWK[]
    }
    vp_formats_supported: {
      mso_mdoc: {
        issuerauth_alg_values?: number[]
        deviceauth_alg_values?: number[]
      }
    }
  }
}

type ClientIdPrefix = 'x509_san_dns' | 'x509_hash'

type OpenID4VPSigned = OpenId4VpRequestEncBase & {
  // OpenID4VP, 5.9.3, https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-5.9.3
  client_id: `${ClientIdPrefix}:${string}`
  // OpenID4VP, A.2, https://openid.net/specs/openid-4-verifiable-presentations-1_0-final.html#appendix-A.2
  // REQUIRED when signed requests defined in Appendix A.3.2 are used with the Digital Credentials API (DC API).
  // A non-empty array of strings, each string representing an Origin of the Verifier that is making the request.
  // The Wallet MUST compare values in this parameter to the Origin to detect replay of the request from a malicious Verifier.
  // If the Origin does not match any of the entries in expected_origins, the Wallet MUST return an error.
  expected_origins: string[]
}

type OpenID4VPUnsigned = OpenId4VpRequestEncBase

/**
 * Generate an ephemeral EC P-256 key pair for ECDH-ES content encryption (A128GCM)
 */
async function createEphemeralEncKeyPair() {
  const keyPair = await subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true, // needed so we can export the public JWK to send to the wallet
    ['deriveKey', 'deriveBits'],
  )

  const publicJwk = await exportJWK(keyPair.publicKey)

  // Attach JOSE hints
  // OpenId4VP, 5.1, Each JWK in the set MUST have a kid (Key ID)
  const kid = `enc-${Date.now()}-${randomBytes(8).toString('hex')}`
  const encPublicJwk: JWK = {
    ...publicJwk,
    use: 'enc',
    alg: 'ECDH-ES',
    kid,
  }

  return { publicJwk: encPublicJwk, privateKey: keyPair.privateKey, kid }
}

// TODO (mdoc): Support multiple credentials - for now we only handle one
const credId = 'credential-1' // Static ID for our single requested credential

export async function buildOpenId4VpRequest(
  requestId: string,
  docType: string,
  requestedClaims: MDocRequestClaimPath[],
  options?: { clientName?: string; expectedOrigins?: string[] },
): Promise<{ request: string; kid: string; protocol: OpenID4VPProtocol }> {
  const { publicJwk, privateKey, kid } = await createEphemeralEncKeyPair()
  const nonce = randomBytes(16).toString('hex')
  const keyStorage = mdocEphemeralKeys()

  // Export the private key to store in cache
  const exportedPrivateKey = await subtle.exportKey('pkcs8', privateKey)
  const keyData: EphemeralKeyData = {
    encryptionPrivateKey: Buffer.from(exportedPrivateKey).toString('base64'),
    created: Date.now(),
    requestId,
  }

  // Build the OpenID4VP request object
  const requestBase: OpenId4VpRequestEncBase = {
    response_type: 'vp_token',
    response_mode: 'dc_api.jwt',
    dcql_query: {
      credentials: [
        {
          id: credId,
          format: 'mso_mdoc',
          meta: {
            doctype_value: docType,
          },
          claims: requestedClaims.map((claim) => ({
            path: claim.path,
            ...(claim.intentToRetain !== undefined && { intent_to_retain: claim.intentToRetain }),
          })),
        },
      ],
    },
    nonce,
    client_metadata: {
      // OpenId4VP, 5.1, This MUST be present for anything other than the default single value of A128GCM.
      // Otherwise, this SHOULD be absent.
      encrypted_response_enc_values_supported: ['A128GCM', 'A256GCM'],
      jwks: {
        keys: [publicJwk],
      },
      // OpenId4VP, 5.1, REQUIRED. An object containing a list of name/value pairs, where the name is a
      // Credential Format Identifier and the value defines format-specific parameters that a Verifier supports
      vp_formats_supported: {
        mso_mdoc: {
          // https://datatracker.ietf.org/doc/html/draft-ietf-jose-fully-specified-algorithms-13
          // -7 ECDSA using P-256 curve
          // -9 ECDSA using P-256 curve and SHA-256
          issuerauth_alg_values: [-7, -9],
          deviceauth_alg_values: [-7, -9],
        },
      },
    },
  }

  // Determine if signing is requested based on presence of expectedOrigins
  const shouldSign = options?.expectedOrigins && options.expectedOrigins.length > 0

  if (shouldSign) {
    invariant(
      options.expectedOrigins!.every((origin) => {
        try {
          const url = new URL(origin)
          return url.protocol === 'https:'
        } catch {
          return false
        }
      }),
      'Each expected origin must be a valid HTTPS URL',
    )
    // Generate signing key and certificate
    const {
      jwk: signingJwk,
      privateKey: signingPrivateKey,
      pemCert,
    } = await createJwkWithX5c({
      alg: 'ECDSA',
      keyUsages: ['sign'],
      subject: {
        commonName: new URL(options.expectedOrigins![0]!).hostname, // Use first expected origin as CN
        organization: options.clientName || 'VO Verifier',
      },
      domains: options.expectedOrigins!.map((origin) => {
        const url = new URL(origin)
        return url.hostname
      }),
    })

    // Compute the x509_hash client identifier
    const x509Hash = computeX509Hash(pemCert)
    const clientId: `x509_hash:${string}` = `x509_hash:${x509Hash}`

    // Create the signed request payload
    const signedRequest: OpenID4VPSigned = {
      ...requestBase,
      client_id: clientId,
      expected_origins: options.expectedOrigins!,
    }

    // Export and store the signing private key
    const exportedSigningPrivateKey = await subtle.exportKey('pkcs8', signingPrivateKey)
    keyData.signingPrivateKey = Buffer.from(exportedSigningPrivateKey).toString('base64')

    // Store the ephemeral keys in cache for later decryption/validation
    await keyStorage.set(requestId, keyData, MDOC_TTL)

    // Sign the request using CompactSign with x5c header
    const jws = await new CompactSign(new TextEncoder().encode(JSON.stringify(signedRequest)))
      .setProtectedHeader({
        alg: 'ES256',
        typ: 'oauth-authz-req+jwt', // Required by OpenID4VP spec
        x5c: signingJwk.x5c, // X.509 certificate chain
      })
      .sign(signingPrivateKey)

    return { request: jws, kid, protocol: 'openid4vp-v1-signed' }
  } else {
    // Return unsigned request
    const unsignedRequest: OpenID4VPUnsigned = requestBase

    // Store the ephemeral keys in cache for later decryption/validation
    await keyStorage.set(requestId, keyData, MDOC_TTL)

    // Return the request as a JSON string for unsigned requests
    return { request: JSON.stringify(unsignedRequest), kid, protocol: 'openid4vp-v1-unsigned' }
  }
}

/**
 * Wrapper type for CBOR tag 24 (embedded CBOR) that preserves both the inner raw bytes
 * and the decoded content. This is necessary for digest validation in mDoc responses.
 *
 * Note: rawBytes contains only the inner byte string content (the encoded IssuerSignedItem).
 * The complete Tag24 structure (including Tag24 header and byte string header) is extracted
 * later using extractTag24Bytes() when building namespace items for digest validation.
 */
type Tag24Wrapper = {
  isTag24Wrapper: true
  rawBytes: Uint8Array
  decoded: unknown
}

function isTag24Wrapper(value: unknown): value is Tag24Wrapper {
  return typeof value === 'object' && value !== null && 'isTag24Wrapper' in value && value.isTag24Wrapper === true
}

/**
 * Extracts the complete Tag24 CBOR structure from the source buffer.
 *
 * Per ISO-18013-5 § 9.1.2.5, digests are calculated over IssuerSignedItemBytes = #6.24(bstr .cbor IssuerSignedItem)
 *
 * CBOR Tag24 structure:
 * - 0xD8 0x18: Tag 24 header (major type 6, tag number 24)
 * - Byte string header: major type 2 with length
 * - Byte string content: the encoded IssuerSignedItem
 */
function extractTag24Bytes(sourceBytes: Buffer, innerContentBytes: Uint8Array): Uint8Array {
  // Find where the inner content appears in the source buffer
  const innerContentBuffer = Buffer.from(innerContentBytes)
  const contentStartIndex = sourceBytes.indexOf(
    new Uint8Array(innerContentBuffer.buffer, innerContentBuffer.byteOffset, innerContentBuffer.byteLength),
  )

  invariant(
    contentStartIndex !== -1,
    `Inner content bytes not found in source CBOR buffer. ` +
      `Looking for ${innerContentBuffer.length} bytes: ${innerContentBuffer.toString('hex').slice(0, 100)}...`,
  )

  // Walk backwards from the content to find the CBOR headers
  // We need to account for:
  // 1. Tag 24 header: 0xD8 0x18 (2 bytes)
  // 2. Byte string header: varies based on length

  const contentLength = innerContentBytes.length

  // Determine byte string header length based on content size
  // CBOR byte string encoding (major type 2):
  // - 0-23 bytes: 1 byte header (0x40-0x57)
  // - 24-255 bytes: 2 bytes (0x58 + 1 byte length)
  // - 256-65535 bytes: 3 bytes (0x59 + 2 bytes length BE)
  // - 65536-4294967295 bytes: 5 bytes (0x5A + 4 bytes length BE)
  let byteStringHeaderLength: number
  if (contentLength <= 23) {
    byteStringHeaderLength = 1
  } else if (contentLength <= 255) {
    byteStringHeaderLength = 2
  } else if (contentLength <= 65535) {
    byteStringHeaderLength = 3
  } else {
    byteStringHeaderLength = 5
  }

  // Tag24 header is always 2 bytes: 0xD8 0x18
  const tag24HeaderLength = 2

  // The complete structure starts before the content
  const headerStartIndex = contentStartIndex - byteStringHeaderLength - tag24HeaderLength

  invariant(
    headerStartIndex >= 0,
    `Calculated header start index is negative (${headerStartIndex}). Content starts at ${contentStartIndex}.`,
  )

  // Verify we found the Tag24 header (0xD8 0x18)
  invariant(
    sourceBytes[headerStartIndex] === 0xd8 && sourceBytes[headerStartIndex + 1] === 0x18,
    `Expected Tag24 header (0xD8 0x18) at index ${headerStartIndex}, ` +
      `found: ${sourceBytes[headerStartIndex]?.toString(16)} ${sourceBytes[headerStartIndex + 1]?.toString(16)}`,
  )

  // Extract the complete Tag24 structure
  const totalLength = tag24HeaderLength + byteStringHeaderLength + contentLength
  const completeTag24Bytes = sourceBytes.subarray(headerStartIndex, headerStartIndex + totalLength)

  return new Uint8Array(completeTag24Bytes.buffer, completeTag24Bytes.byteOffset, completeTag24Bytes.byteLength)
}

function decodeCbor(source: Buffer | string) {
  const sourceBytes = typeof source === 'string' ? Buffer.from(source) : Buffer.from(source.buffer, source.byteOffset, source.byteLength)

  return decode(new Uint8Array(sourceBytes.buffer, sourceBytes.byteOffset, sourceBytes.byteLength), {
    tags: new Map<TagNumber, TagDecoder>([
      [
        24, // Embedded CBOR (IssuerSignedItemBytes)
        (tag: ITag) => {
          const rawBytes = tag.contents as Uint8Array
          const decoded = decode(rawBytes, {
            tags: new Map<TagNumber, TagDecoder>([
              [
                1004, // Custom date format used in mdoc issuerSigned data
                (tag: ITag) => {
                  return new Date(tag.contents as string)
                },
              ],
            ]),
          })
          return {
            isTag24Wrapper: true,
            rawBytes,
            decoded,
          } satisfies Tag24Wrapper
        },
      ],
    ]),
  })
}

function decodeVpToken(cborEncodedVpToken: string): MDocDeviceResponse {
  const vpTokenBuffer = Buffer.from(cborEncodedVpToken, 'base64url')
  const decodedVpToken = decodeCbor(vpTokenBuffer)

  invariant(typeof decodedVpToken === 'object' && decodedVpToken !== null, 'Invalid vp_token structure')
  invariant('version' in decodedVpToken && typeof decodedVpToken.version === 'string', 'vp_token.version missing')
  invariant('status' in decodedVpToken && typeof decodedVpToken.status === 'number', 'vp_token.status missing')
  invariant(Object.values(mDocResponseStatus).includes(decodedVpToken.status as MDocResponseStatus), 'vp_token.status invalid')
  invariant('documents' in decodedVpToken && Array.isArray(decodedVpToken.documents), 'vp_token.documents missing')

  const documents = decodedVpToken.documents.map((doc: unknown) => {
    invariant(typeof doc === 'object' && doc !== null, 'Invalid document in vp_token.documents')
    invariant('docType' in doc && typeof doc.docType === 'string', 'document.docType missing')

    let issuerSigned: MDocIssuerSigned | undefined

    if ('issuerSigned' in doc) {
      invariant(doc.issuerSigned && typeof doc.issuerSigned === 'object', 'document.issuerSigned invalid')
      invariant(
        'nameSpaces' in doc.issuerSigned && doc.issuerSigned.nameSpaces && typeof doc.issuerSigned.nameSpaces === 'object',
        'document.issuerSigned.nameSpaces missing or invalid',
      )

      const nameSpaces = Object.entries(doc.issuerSigned.nameSpaces)
        .map(([namespace, items]) => {
          invariant(Array.isArray(items), `Namespace "${namespace}" items must be an array`)

          return {
            [namespace]: items.map((wrappedItem: unknown) => {
              // The item could be either:
              // 1. A Tag24Wrapper (if the CBOR has tag 24) - preferred
              // 2. Already decoded IssuerSignedItem (if tag 24 is missing or handled differently)
              invariant(isTag24Wrapper(wrappedItem), 'Invalid Tag24Wrapper structure')

              const item = wrappedItem.decoded
              // Extract the complete Tag24 structure from the source buffer for digest validation
              // Per ISO-18013-5 § 9.1.2.5, digests are calculated over the complete IssuerSignedItemBytes
              // which includes the Tag24 header, not just the inner content
              const issuerSignedItemBytes = extractTag24Bytes(vpTokenBuffer, wrappedItem.rawBytes)

              invariant(item && typeof item === 'object', 'Invalid IssuerSignedItem CBOR structure')
              invariant(
                'digestID' in item && typeof item.digestID === 'number',
                'IssuerSignedItem missing or contains an invalid digestID value',
              )
              invariant(
                'random' in item && item.random instanceof Uint8Array,
                'IssuerSignedItem missing or contains an invalid random value',
              )
              invariant(
                'elementIdentifier' in item && typeof item.elementIdentifier === 'string',
                'IssuerSignedItem missing or contains an invalid elementIdentifier value',
              )
              invariant('elementValue' in item, 'IssuerSignedItem missing or contains an invalid elementValue value')

              return {
                issuerSignedItem: {
                  digestID: item.digestID,
                  random: item.random,
                  elementIdentifier: item.elementIdentifier,
                  elementValue: item.elementValue,
                },
                issuerSignedItemBytes: issuerSignedItemBytes,
              } satisfies MDocNamespaceItem
            }),
          }
        })
        .reduce((acc, curr) => ({ ...acc, ...curr }), {})

      invariant('issuerAuth' in doc.issuerSigned, 'document.issuerSigned.issuerAuth missing')
      invariant(Array.isArray(doc.issuerSigned.issuerAuth), 'document.issuerSigned.issuerAuth invalid')
      invariant(doc.issuerSigned.issuerAuth.length === 4, 'document.issuerSigned.issuerAuth must be a COSE_Sign1 array with 4 elements')

      // Parse COSE_Sign1 structure: [protectedHeaders, unprotectedHeaders, payload, signature]
      const [protectedHeaders, unprotectedHeaders, payload, signature] = doc.issuerSigned.issuerAuth

      // Validate protected headers (should be a Uint8Array containing CBOR-encoded map)
      invariant(protectedHeaders instanceof Uint8Array, 'document.issuerSigned.issuerAuth[0] (protectedHeaders) must be a Uint8Array')

      const protectedHeadersDecoded = decode(protectedHeaders) as Map<number, unknown>
      invariant(
        typeof protectedHeadersDecoded === 'object' && protectedHeadersDecoded,
        'document.issuerSigned.issuerAuth protectedHeaders must decode to an object',
      )

      invariant(
        typeof unprotectedHeaders === 'object' && unprotectedHeaders,
        'document.issuerSigned.issuerAuth[1] (unprotectedHeaders) must be an object',
      )
      invariant(
        payload === null || payload instanceof Uint8Array,
        'document.issuerSigned.issuerAuth[2] (payload) must be a Uint8Array or null',
      )
      invariant(signature instanceof Uint8Array, 'document.issuerSigned.issuerAuth[3] (signature) must be a Uint8Array')

      issuerSigned = {
        nameSpaces,
        issuerAuth: {
          protectedHeaders,
          protectedHeadersDecoded,
          unprotectedHeaders,
          payload,
          signature,
        },
      }
    }

    let errors
    if ('errors' in doc && doc.errors) {
      invariant(typeof doc.errors === 'object', 'document.errors must be an object')
      errors = [doc.errors as { [namespace: string]: { [dataElementId: string]: number } }]
    }

    return {
      docType: doc.docType as string,
      issuerSigned,
      errors,
    } satisfies MDocDocument
  })

  let documentErrors
  if ('documentErrors' in decodedVpToken && decodedVpToken.documentErrors) {
    invariant(typeof decodedVpToken.documentErrors === 'object', 'vp_token.documentErrors must be an object')
    documentErrors = [decodedVpToken.documentErrors as { [docType: string]: number }]
  }

  const vpToken: MDocDeviceResponse = {
    version: decodedVpToken.version as string,
    status: decodedVpToken.status as MDocResponseStatus,
    documents,
    documentErrors,
  }

  return vpToken
}

export async function decodeAndValidateOpenId4VpResponse(
  { requestId, docType }: MDocRequestDetails,
  encryptedResponse: string,
): Promise<ProcessedMDocRequestResponse> {
  const keyStorage = await mdocEphemeralKeys()
  const keyData = await keyStorage.get(requestId)
  invariant(keyData, `Ephemeral key for request "${requestId}" not found or expired`)

  // Import the private key for ECDH-ES decryption
  const privateKeyBuffer = Buffer.from(keyData.encryptionPrivateKey, 'base64')
  const importedPrivateKey = await subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits'],
  )

  const decryptResult = await jwtDecrypt(encryptedResponse, importedPrivateKey)
  const payload = decryptResult.payload
  const decryptedAt = new Date()

  invariant(typeof payload === 'object' && payload, 'Invalid payload in decrypted response')
  invariant(payload.vp_token && typeof payload.vp_token === 'object', 'vp_token missing in decrypted response')
  invariant(
    credId in payload.vp_token && Array.isArray(payload.vp_token[credId]),
    `vp_token for credential ID "${credId}" missing in response`,
  )

  const mDocDeviceResponse = decodeVpToken(payload.vp_token[credId][0]) // temporarily only support a single credential

  // Validate the mDoc device response according to ISO18013-5 section 9.3.1
  const validationResults = await validateMDocResponse(mDocDeviceResponse, docType, decryptedAt)

  // Clean up the ephemeral key after successful decryption and validation
  await keyStorage.delete(requestId)

  return {
    mDocDeviceResponse,
    diagnostics: {
      validation: validationResults,
      response: JSON.stringify(decryptResult),
      deviceResponse: JSON.stringify(mDocDeviceResponse),
    },
  }
}
