import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { decode, encode, Tag } from 'cbor2'
import { createHash } from 'crypto'
import * as HPKE from 'hpke'
import { InvariantError } from '../../../../util/invariant'
import type { MDocRequestClaimPath } from '../types'

// Mocks
const mockCacheGet = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockCacheSet = jest.fn<(...args: unknown[]) => Promise<void>>()
const mockCacheDelete = jest.fn<(...args: unknown[]) => Promise<void>>()

jest.mock('../shared-config', () => ({
  mdocEphemeralKeys: () => ({
    get: (...args: unknown[]) => mockCacheGet(...args),
    set: (...args: unknown[]) => mockCacheSet(...args),
    delete: (...args: unknown[]) => mockCacheDelete(...args),
  }),
}))

const mockValidateMDocResponse = jest.fn<(...args: unknown[]) => Promise<unknown>>()
jest.mock('../mdoc', () => ({
  validateMDocResponse: (...args: unknown[]) => mockValidateMDocResponse(...args),
}))

// Import after mocks are set up
import { buildDcApiSessionTranscript, buildISO18013_7DeviceRequest, decodeAndValidateISO18013_7Response } from './orgIsoMdoc'

// Helpers
// cbor2.decode returns CBOR maps as plain objects, not JS Map instances.
// These helpers handle both forms so tests work regardless.

function get(obj: unknown, key: string | number): unknown {
  if (obj instanceof Map) return obj.get(key)
  if (typeof obj === 'object' && obj !== null) return (obj as Record<string | number, unknown>)[key]
  return undefined
}

function has(obj: unknown, key: string | number): boolean {
  if (obj instanceof Map) return obj.has(key)
  if (typeof obj === 'object' && obj !== null) return key in (obj as Record<string | number, unknown>)
  return false
}

function size(obj: unknown): number {
  if (obj instanceof Map) return obj.size
  if (typeof obj === 'object' && obj !== null) return Object.keys(obj).length
  return 0
}

// Test data
const TEST_ORIGIN = 'https://example.com'
const TEST_REQUEST_ID = 'test-request-123'
const TEST_DOC_TYPE = 'org.iso.18013.5.1.mDL'

const testClaims: MDocRequestClaimPath[] = [
  { path: ['org.iso.18013.5.1', 'family_name'], intentToRetain: false },
  { path: ['org.iso.18013.5.1', 'given_name'], intentToRetain: false },
  { path: ['org.iso.18013.5.1', 'birth_date'], intentToRetain: true },
]

describe('orgIsoMdoc', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockValidateMDocResponse.mockResolvedValue({
      isValid: true,
      decryptedAt: new Date(),
      validatedAt: new Date(),
      documents: [],
    })
  })

  describe('buildDcApiSessionTranscript', () => {
    it('should return valid CBOR-encoded bytes', () => {
      const result = buildDcApiSessionTranscript('dGVzdA', TEST_ORIGIN)
      expect(result).toBeInstanceOf(Uint8Array)

      const decoded = decode(result) as unknown[]
      expect(Array.isArray(decoded)).toBe(true)
    })

    it('should produce SessionTranscript with [null, null, ["dcapi", hash]]', () => {
      const encryptionInfoBase64 = 'dGVzdA'
      const result = buildDcApiSessionTranscript(encryptionInfoBase64, TEST_ORIGIN)
      const decoded = decode(result) as [null, null, [string, Uint8Array]]

      expect(decoded).toHaveLength(3)
      expect(decoded[0]).toBeNull()
      expect(decoded[1]).toBeNull()
      expect(decoded[2]).toHaveLength(2)
      expect(decoded[2]![0]).toBe('dcapi')
      expect(decoded[2]![1]).toBeInstanceOf(Uint8Array)
    })

    it('should produce a SHA-256 digest of CBOR([encryptionInfoBase64, origin])', () => {
      const encryptionInfoBase64 = 'dGVzdA'
      const result = buildDcApiSessionTranscript(encryptionInfoBase64, TEST_ORIGIN)
      const decoded = decode(result) as [null, null, [string, Uint8Array]]

      const dcapiInfo = [encryptionInfoBase64, TEST_ORIGIN]
      const expectedDigest = createHash('sha256').update(encode(dcapiInfo)).digest()

      expect(Buffer.from(decoded[2]![1]!)).toEqual(expectedDigest)
    })

    it('should produce different transcripts for different origins', () => {
      const a = buildDcApiSessionTranscript('dGVzdA', 'https://a.example.com')
      const b = buildDcApiSessionTranscript('dGVzdA', 'https://b.example.com')
      expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false)
    })

    it('should produce different transcripts for different encryptionInfo', () => {
      const a = buildDcApiSessionTranscript('aaa', TEST_ORIGIN)
      const b = buildDcApiSessionTranscript('bbb', TEST_ORIGIN)
      expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false)
    })

    it('should be deterministic for the same inputs', () => {
      const a = buildDcApiSessionTranscript('dGVzdA', TEST_ORIGIN)
      const b = buildDcApiSessionTranscript('dGVzdA', TEST_ORIGIN)
      expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true)
    })
  })

  // ── buildISO18013_7DeviceRequest ──

  describe('buildISO18013_7DeviceRequest', () => {
    it('should return base64url-encoded deviceRequest and encryptionInfo', async () => {
      const result = await buildISO18013_7DeviceRequest(TEST_REQUEST_ID, TEST_DOC_TYPE, testClaims, TEST_ORIGIN)

      expect(result).toHaveProperty('deviceRequest')
      expect(result).toHaveProperty('encryptionInfo')
      expect(typeof result.deviceRequest).toBe('string')
      expect(typeof result.encryptionInfo).toBe('string')

      // Verify they are valid base64url
      expect(() => Buffer.from(result.deviceRequest, 'base64url')).not.toThrow()
      expect(() => Buffer.from(result.encryptionInfo, 'base64url')).not.toThrow()
    })

    it('should produce a valid CBOR-encoded DeviceRequest v1.1', async () => {
      const result = await buildISO18013_7DeviceRequest(TEST_REQUEST_ID, TEST_DOC_TYPE, testClaims, TEST_ORIGIN)
      const deviceRequestBytes = Buffer.from(result.deviceRequest, 'base64url')
      const deviceRequest = decode(deviceRequestBytes)

      expect(get(deviceRequest, 'version')).toBe('1.1')
      expect(get(deviceRequest, 'docRequests')).toBeDefined()
      expect(Array.isArray(get(deviceRequest, 'docRequests'))).toBe(true)
      expect(get(deviceRequest, 'deviceRequestInfo')).toBeDefined()
      expect(get(deviceRequest, 'readerAuthAll')).toBeDefined()
    })

    it('should include the correct docType in the ItemsRequest', async () => {
      const result = await buildISO18013_7DeviceRequest(TEST_REQUEST_ID, TEST_DOC_TYPE, testClaims, TEST_ORIGIN)
      const deviceRequestBytes = Buffer.from(result.deviceRequest, 'base64url')
      const deviceRequest = decode(deviceRequestBytes)

      const docRequests = get(deviceRequest, 'docRequests') as unknown[]
      expect(docRequests).toHaveLength(1)

      const docRequest = docRequests[0]!
      const taggedItemsRequest = get(docRequest, 'itemsRequest') as { tag: number; contents: Uint8Array }
      expect(taggedItemsRequest.tag).toBe(24)

      const itemsRequest = decode(taggedItemsRequest.contents)
      expect(get(itemsRequest, 'docType')).toBe(TEST_DOC_TYPE)
    })

    it('should group requested claims by namespace', async () => {
      const claims: MDocRequestClaimPath[] = [
        { path: ['org.iso.18013.5.1', 'family_name'], intentToRetain: false },
        { path: ['org.iso.18013.5.1', 'given_name'], intentToRetain: true },
        { path: ['org.iso.18013.5.1.aamva', 'DHS_compliance'], intentToRetain: false },
      ]

      const result = await buildISO18013_7DeviceRequest(TEST_REQUEST_ID, TEST_DOC_TYPE, claims, TEST_ORIGIN)
      const deviceRequestBytes = Buffer.from(result.deviceRequest, 'base64url')
      const deviceRequest = decode(deviceRequestBytes)

      const docRequests = get(deviceRequest, 'docRequests') as unknown[]
      const taggedItemsRequest = get(docRequests[0], 'itemsRequest') as { tag: number; contents: Uint8Array }
      const itemsRequest = decode(taggedItemsRequest.contents)
      const nameSpaces = get(itemsRequest, 'nameSpaces')

      expect(has(nameSpaces, 'org.iso.18013.5.1')).toBe(true)
      expect(has(nameSpaces, 'org.iso.18013.5.1.aamva')).toBe(true)

      const isoNs = get(nameSpaces, 'org.iso.18013.5.1')
      expect(get(isoNs, 'family_name')).toBe(false)
      expect(get(isoNs, 'given_name')).toBe(true)

      const aamvaNs = get(nameSpaces, 'org.iso.18013.5.1.aamva')
      expect(get(aamvaNs, 'DHS_compliance')).toBe(false)
    })

    it('should skip claims with incomplete paths', async () => {
      const claims: MDocRequestClaimPath[] = [
        { path: ['org.iso.18013.5.1', 'family_name'] },
        { path: ['org.iso.18013.5.1'], intentToRetain: false }, // missing elementIdentifier
        { path: [], intentToRetain: false }, // empty path
      ]

      const result = await buildISO18013_7DeviceRequest(TEST_REQUEST_ID, TEST_DOC_TYPE, claims, TEST_ORIGIN)
      const deviceRequestBytes = Buffer.from(result.deviceRequest, 'base64url')
      const deviceRequest = decode(deviceRequestBytes)

      const docRequests = get(deviceRequest, 'docRequests') as unknown[]
      const taggedItemsRequest = get(docRequests[0], 'itemsRequest') as { tag: number; contents: Uint8Array }
      const itemsRequest = decode(taggedItemsRequest.contents)
      const nameSpaces = get(itemsRequest, 'nameSpaces')

      // Only the valid claim should be included
      expect(size(nameSpaces)).toBe(1)
      expect(size(get(nameSpaces, 'org.iso.18013.5.1'))).toBe(1)
    })

    it('should produce a valid EncryptionInfo CBOR structure', async () => {
      const result = await buildISO18013_7DeviceRequest(TEST_REQUEST_ID, TEST_DOC_TYPE, testClaims, TEST_ORIGIN)
      const encryptionInfoBytes = Buffer.from(result.encryptionInfo, 'base64url')
      const encryptionInfo = decode(encryptionInfoBytes) as [string, unknown]

      expect(encryptionInfo[0]).toBe('dcapi')
      const payload = encryptionInfo[1]
      expect(get(payload, 'nonce')).toBeInstanceOf(Uint8Array)
      expect(get(payload, 'recipientPublicKey')).toBeDefined()

      const coseKey = get(payload, 'recipientPublicKey')
      expect(get(coseKey, 1)).toBe(2) // kty: EC2
      expect(get(coseKey, -1)).toBe(1) // crv: P-256
      expect(get(coseKey, -2)).toBeInstanceOf(Uint8Array) // x coordinate
      expect(get(coseKey, -3)).toBeInstanceOf(Uint8Array) // y coordinate
    })

    it('should include per-doc readerAuth as a plain 4-element array (no Tag 18)', async () => {
      const result = await buildISO18013_7DeviceRequest(TEST_REQUEST_ID, TEST_DOC_TYPE, testClaims, TEST_ORIGIN)
      const deviceRequestBytes = Buffer.from(result.deviceRequest, 'base64url')
      const deviceRequest = decode(deviceRequestBytes)

      const docRequests = get(deviceRequest, 'docRequests') as unknown[]
      const readerAuth = get(docRequests[0], 'readerAuth') as unknown[]

      expect(Array.isArray(readerAuth)).toBe(true)
      expect(readerAuth).toHaveLength(4)
      expect(readerAuth[0]).toBeInstanceOf(Uint8Array) // protectedHeaders
      expect(typeof readerAuth[1]).toBe('object') // unprotectedHeaders
      expect(readerAuth[2]).toBeNull() // detached payload
      expect(readerAuth[3]).toBeInstanceOf(Uint8Array) // signature
    })

    it('should include readerAuthAll as an array of COSE_Sign1', async () => {
      const result = await buildISO18013_7DeviceRequest(TEST_REQUEST_ID, TEST_DOC_TYPE, testClaims, TEST_ORIGIN)
      const deviceRequestBytes = Buffer.from(result.deviceRequest, 'base64url')
      const deviceRequest = decode(deviceRequestBytes)

      const readerAuthAll = get(deviceRequest, 'readerAuthAll') as unknown[][]
      expect(Array.isArray(readerAuthAll)).toBe(true)
      expect(readerAuthAll).toHaveLength(1)

      const coseSign1 = readerAuthAll[0]!
      expect(Array.isArray(coseSign1)).toBe(true)
      expect(coseSign1).toHaveLength(4)
      expect(coseSign1[2]).toBeNull() // detached payload
    })

    it('should include deviceRequestInfo with useCases', async () => {
      const result = await buildISO18013_7DeviceRequest(TEST_REQUEST_ID, TEST_DOC_TYPE, testClaims, TEST_ORIGIN)
      const deviceRequestBytes = Buffer.from(result.deviceRequest, 'base64url')
      const deviceRequest = decode(deviceRequestBytes)

      const deviceRequestInfo = get(deviceRequest, 'deviceRequestInfo') as { tag: number; contents: Uint8Array }
      expect(deviceRequestInfo.tag).toBe(24)

      const info = decode(deviceRequestInfo.contents)
      const useCases = get(info, 'useCases') as unknown[]
      expect(useCases).toHaveLength(1)

      const useCase = useCases[0]!
      expect(get(useCase, 'mandatory')).toBe(true)
      expect(get(useCase, 'documentSets')).toEqual([[0]])
    })

    it('should store ephemeral key data in cache', async () => {
      await buildISO18013_7DeviceRequest(TEST_REQUEST_ID, TEST_DOC_TYPE, testClaims, TEST_ORIGIN)

      expect(mockCacheSet).toHaveBeenCalledTimes(1)
      const [cacheKey, keyData] = mockCacheSet.mock.calls[0] as [string, Record<string, unknown>]
      expect(cacheKey).toBe(`mdoc:keys:${TEST_REQUEST_ID}`)
      expect(keyData).toHaveProperty('encryptionPrivateKey')
      expect(keyData).toHaveProperty('encryptionInfoBase64')
      expect(keyData).toHaveProperty('origin', TEST_ORIGIN)
      expect(keyData).toHaveProperty('requestId', TEST_REQUEST_ID)
      expect(keyData).toHaveProperty('created')
    })

    it('should produce different nonces on each call', async () => {
      const result1 = await buildISO18013_7DeviceRequest('req-1', TEST_DOC_TYPE, testClaims, TEST_ORIGIN)
      const result2 = await buildISO18013_7DeviceRequest('req-2', TEST_DOC_TYPE, testClaims, TEST_ORIGIN)

      const enc1 = decode(Buffer.from(result1.encryptionInfo, 'base64url')) as [string, unknown]
      const enc2 = decode(Buffer.from(result2.encryptionInfo, 'base64url')) as [string, unknown]

      const nonce1 = Buffer.from(get(enc1[1], 'nonce') as Uint8Array)
      const nonce2 = Buffer.from(get(enc2[1], 'nonce') as Uint8Array)
      expect(nonce1.equals(nonce2)).toBe(false)
    })

    it('should default intentToRetain to false when not specified', async () => {
      const claims: MDocRequestClaimPath[] = [{ path: ['org.iso.18013.5.1', 'family_name'] }]

      const result = await buildISO18013_7DeviceRequest(TEST_REQUEST_ID, TEST_DOC_TYPE, claims, TEST_ORIGIN)
      const deviceRequestBytes = Buffer.from(result.deviceRequest, 'base64url')
      const deviceRequest = decode(deviceRequestBytes)

      const docRequests = get(deviceRequest, 'docRequests') as unknown[]
      const taggedItemsRequest = get(docRequests[0], 'itemsRequest') as { tag: number; contents: Uint8Array }
      const itemsRequest = decode(taggedItemsRequest.contents)
      const nameSpaces = get(itemsRequest, 'nameSpaces')

      expect(get(get(nameSpaces, 'org.iso.18013.5.1'), 'family_name')).toBe(false)
    })
  })

  describe('decodeAndValidateISO18013_7Response', () => {
    async function buildEncryptedResponse(requestId: string, origin: string) {
      // Build a real device request to get the ephemeral keys stored
      const { encryptionInfo } = await buildISO18013_7DeviceRequest(requestId, TEST_DOC_TYPE, testClaims, origin)

      // Extract the cached key data from the mock
      const [, keyData] = mockCacheSet.mock.calls[mockCacheSet.mock.calls.length - 1] as [string, Record<string, unknown>]

      // Build a minimal valid DeviceResponse
      const protectedHeaders = encode(new Map([[1, -7]]))
      const unprotectedHeaders = new Map([[33, new Uint8Array([0x01])]])
      const signature = new Uint8Array(64)
      const issuerSignedItem = new Map<string, unknown>([
        ['digestID', 0],
        ['random', new Uint8Array([0x01])],
        ['elementIdentifier', 'family_name'],
        ['elementValue', 'Smith'],
      ])
      const deviceResponse = {
        version: '1.0',
        status: 0,
        documents: [
          {
            docType: TEST_DOC_TYPE,
            issuerSigned: {
              nameSpaces: { 'org.iso.18013.5.1': [new Tag(24, encode(issuerSignedItem))] },
              issuerAuth: [protectedHeaders, unprotectedHeaders, null, signature],
            },
          },
        ],
      }
      const deviceResponseCbor = encode(deviceResponse)

      // Encrypt the response using HPKE
      const encryptionInfoBytes = Buffer.from(encryptionInfo, 'base64url')
      const encryptionInfoDecoded = decode(encryptionInfoBytes) as [string, unknown]
      const coseKey = get(encryptionInfoDecoded[1], 'recipientPublicKey')

      // Build the session transcript for HPKE info
      const sessionTranscriptCbor = buildDcApiSessionTranscript(encryptionInfo, origin)

      // Extract raw public key from COSE_Key
      const x = get(coseKey, -2) as Uint8Array
      const y = get(coseKey, -3) as Uint8Array

      // Import the public key for HPKE
      const publicKeyRaw = new Uint8Array(1 + x.length + y.length)
      publicKeyRaw[0] = 0x04 // uncompressed point
      publicKeyRaw.set(x, 1)
      publicKeyRaw.set(y, 1 + x.length)

      const suite = new HPKE.CipherSuite(HPKE.KEM_DHKEM_P256_HKDF_SHA256, HPKE.KDF_HKDF_SHA256, HPKE.AEAD_AES_128_GCM)
      const recipientPublicKey = await suite.DeserializePublicKey(publicKeyRaw)

      const { encapsulatedSecret, ciphertext } = await suite.Seal(recipientPublicKey, deviceResponseCbor, {
        info: sessionTranscriptCbor,
        aad: new Uint8Array(0),
      })

      // Build the encrypted response CBOR: ["dcapi", { "enc": bstr, "cipherText": bstr }]
      const encryptedResponse = ['dcapi', { enc: new Uint8Array(encapsulatedSecret), cipherText: new Uint8Array(ciphertext) }]
      const encodedResponse = Buffer.from(encode(encryptedResponse)).toString('base64url')

      return { encodedResponse, keyData }
    }

    it('should decrypt and decode a valid encrypted response', async () => {
      const requestId = 'decrypt-test-1'
      const { encodedResponse, keyData } = await buildEncryptedResponse(requestId, TEST_ORIGIN)

      // Set up cache mock to return the stored key data
      mockCacheGet.mockResolvedValueOnce(keyData)

      const requestDetails = {
        requestId,
        requestedById: 'user-1',
        docType: TEST_DOC_TYPE,
        requestedClaims: testClaims,
        createdAt: Date.now(),
      }

      const result = await decodeAndValidateISO18013_7Response(requestDetails, encodedResponse)

      expect(result.mDocDeviceResponse).toBeDefined()
      expect(result.mDocDeviceResponse.version).toBe('1.0')
      expect(result.mDocDeviceResponse.status).toBe(0)
      expect(result.mDocDeviceResponse.documents).toHaveLength(1)
      expect(result.diagnostics).toBeDefined()
    })

    it('should call validateMDocResponse with the decoded response', async () => {
      const requestId = 'validate-test-1'
      const { encodedResponse, keyData } = await buildEncryptedResponse(requestId, TEST_ORIGIN)
      mockCacheGet.mockResolvedValueOnce(keyData)

      const requestDetails = {
        requestId,
        requestedById: 'user-1',
        docType: TEST_DOC_TYPE,
        requestedClaims: testClaims,
        createdAt: Date.now(),
      }

      await decodeAndValidateISO18013_7Response(requestDetails, encodedResponse)

      expect(mockValidateMDocResponse).toHaveBeenCalledTimes(1)
      const [mDocDeviceResponse, docType, decryptedAt] = mockValidateMDocResponse.mock.calls[0] as [unknown, string, Date]
      expect(mDocDeviceResponse).toBeDefined()
      expect(mDocDeviceResponse).toHaveProperty('version', '1.0')
      expect(mDocDeviceResponse).toHaveProperty('documents')
      expect(docType).toBe(TEST_DOC_TYPE)
      expect(decryptedAt).toBeInstanceOf(Date)
    })

    it('should clean up ephemeral keys after successful decryption', async () => {
      const requestId = 'cleanup-test-1'
      const { encodedResponse, keyData } = await buildEncryptedResponse(requestId, TEST_ORIGIN)
      mockCacheGet.mockResolvedValueOnce(keyData)

      const requestDetails = {
        requestId,
        requestedById: 'user-1',
        docType: TEST_DOC_TYPE,
        requestedClaims: testClaims,
        createdAt: Date.now(),
      }

      await decodeAndValidateISO18013_7Response(requestDetails, encodedResponse)

      expect(mockCacheDelete).toHaveBeenCalledWith(`mdoc:keys:${requestId}`)
    })

    it('should include diagnostics with protocol info and device response', async () => {
      const requestId = 'diag-test-1'
      const { encodedResponse, keyData } = await buildEncryptedResponse(requestId, TEST_ORIGIN)
      mockCacheGet.mockResolvedValueOnce(keyData)

      const requestDetails = {
        requestId,
        requestedById: 'user-1',
        docType: TEST_DOC_TYPE,
        requestedClaims: testClaims,
        createdAt: Date.now(),
      }

      const result = await decodeAndValidateISO18013_7Response(requestDetails, encodedResponse)

      expect(result.diagnostics).toBeDefined()
      const responseInfo = JSON.parse(result.diagnostics!.response)
      expect(responseInfo.protocol).toBe('org-iso-mdoc')
      expect(responseInfo.decryptedAt).toBeDefined()
      expect(result.diagnostics!.deviceResponse).toBeDefined()
    })

    it('should throw when ephemeral key is not found in cache', async () => {
      mockCacheGet.mockResolvedValueOnce(null)

      const requestDetails = {
        requestId: 'missing-key',
        requestedById: 'user-1',
        docType: TEST_DOC_TYPE,
        requestedClaims: testClaims,
        createdAt: Date.now(),
      }

      await expect(decodeAndValidateISO18013_7Response(requestDetails, 'dGVzdA')).rejects.toThrow(InvariantError)
    })

    it('should throw when encryptionInfoBase64 is missing from cached key data', async () => {
      mockCacheGet.mockResolvedValueOnce({
        encryptionPrivateKey: 'somekey',
        created: Date.now(),
        requestId: 'test',
      })

      const requestDetails = {
        requestId: 'no-enc-info',
        requestedById: 'user-1',
        docType: TEST_DOC_TYPE,
        requestedClaims: testClaims,
        createdAt: Date.now(),
      }

      await expect(decodeAndValidateISO18013_7Response(requestDetails, 'dGVzdA')).rejects.toThrow(InvariantError)
    })
  })
})
