import { describe, expect, it } from '@jest/globals'
import { Tag, encode } from 'cbor2'
import { InvariantError } from '../../../../util/invariant'
import { decodeCbor, decodeDeviceResponse } from './cborHelpers'

function buildMinimalDeviceResponse(overrides: Record<string, unknown> = {}) {
  const protectedHeaders = encode(new Map([[1, -7]])) // {1: -7} = ES256
  const unprotectedHeaders = new Map([[33, new Uint8Array([0x01, 0x02, 0x03])]])
  const signature = new Uint8Array(64)

  const issuerSignedItem = new Map<string, unknown>([
    ['digestID', 1],
    ['random', new Uint8Array([0xaa, 0xbb, 0xcc])],
    ['elementIdentifier', 'family_name'],
    ['elementValue', 'Smith'],
  ])
  const tag24Item = new Tag(24, encode(issuerSignedItem))

  const nameSpaces = {
    'org.iso.18013.5.1': [tag24Item],
  }

  const issuerAuth = [protectedHeaders, unprotectedHeaders, null, signature]

  const doc = {
    docType: 'org.iso.18013.5.1.mDL',
    issuerSigned: {
      nameSpaces,
      issuerAuth,
    },
  }

  return {
    version: '1.0',
    status: 0,
    documents: [doc],
    ...overrides,
  }
}

function encodeToBase64url(value: unknown): string {
  return Buffer.from(encode(value)).toString('base64url')
}

describe('cborHelpers', () => {
  describe('decodeCbor', () => {
    it('should decode a simple CBOR map from a Buffer', () => {
      const input = encode({ hello: 'world' })
      const result = decodeCbor(Buffer.from(input)) as Record<string, unknown>
      expect(result).toEqual({ hello: 'world' })
    })

    it('should decode CBOR from a Buffer created from hex', () => {
      const encoded = encode({ a: 1 })
      const hex = Buffer.from(encoded).toString('hex')
      const result = decodeCbor(Buffer.from(hex, 'hex')) as Record<string, unknown>
      expect(result).toEqual({ a: 1 })
    })

    it('should decode Tag24-wrapped content into a Tag24Wrapper object', () => {
      const inner = { test: 'data' }
      const tag24 = new Tag(24, encode(inner))
      const encoded = encode(tag24)

      const result = decodeCbor(Buffer.from(encoded)) as { isTag24Wrapper: boolean; rawBytes: Uint8Array; decoded: unknown }
      expect(result.isTag24Wrapper).toBe(true)
      expect(result.decoded).toEqual({ test: 'data' })
      expect(result.rawBytes).toBeInstanceOf(Uint8Array)
    })

    it('should handle Uint8Array input', () => {
      const encoded = encode({ key: 'value' })
      const result = decodeCbor(Buffer.from(encoded)) as Record<string, unknown>
      expect(result).toEqual({ key: 'value' })
    })

    it('should decode nested Tag24 — inner Tag24 stays as raw cbor2 Tag', () => {
      const innerInner = { deep: true }
      const innerTag = new Tag(24, encode(innerInner))
      const outerTag = new Tag(24, encode(innerTag))
      const encoded = encode(outerTag)

      const result = decodeCbor(Buffer.from(encoded)) as { isTag24Wrapper: boolean; decoded: { tag: number; contents: Uint8Array } }
      expect(result.isTag24Wrapper).toBe(true)
      // The inner decoder uses a limited tag set (only Tag 1004), so nested Tag24 is a raw Tag object
      expect(result.decoded.tag).toBe(24)
      expect(result.decoded.contents).toBeInstanceOf(Uint8Array)
    })

    it('should decode CBOR integers and arrays', () => {
      const result = decodeCbor(Buffer.from(encode([1, 2, 3])))
      expect(result).toEqual([1, 2, 3])
    })

    it('should decode CBOR with binary data', () => {
      const data = { bin: new Uint8Array([0xde, 0xad, 0xbe, 0xef]) }
      const result = decodeCbor(Buffer.from(encode(data))) as Record<string, unknown>
      expect(result.bin).toBeInstanceOf(Uint8Array)
      expect(Buffer.from(result.bin as Uint8Array).toString('hex')).toBe('deadbeef')
    })
  })

  // ── decodeDeviceResponse ──

  describe('decodeDeviceResponse', () => {
    it('should decode a valid minimal DeviceResponse', () => {
      const response = buildMinimalDeviceResponse()
      const base64url = encodeToBase64url(response)

      const result = decodeDeviceResponse(base64url)

      expect(result.version).toBe('1.0')
      expect(result.status).toBe(0)
      expect(result.documents).toHaveLength(1)
      expect(result.documents[0]!.docType).toBe('org.iso.18013.5.1.mDL')
    })

    it('should parse issuerSigned nameSpaces and items', () => {
      const response = buildMinimalDeviceResponse()
      const base64url = encodeToBase64url(response)

      const result = decodeDeviceResponse(base64url)
      const doc = result.documents[0]!

      expect(doc.issuerSigned).toBeDefined()
      const ns = doc.issuerSigned!.nameSpaces['org.iso.18013.5.1']!
      expect(ns).toHaveLength(1)
      expect(ns[0]!.issuerSignedItem.digestID).toBe(1)
      expect(ns[0]!.issuerSignedItem.elementIdentifier).toBe('family_name')
      expect(ns[0]!.issuerSignedItem.elementValue).toBe('Smith')
      expect(ns[0]!.issuerSignedItem.random).toBeInstanceOf(Uint8Array)
      expect(ns[0]!.issuerSignedItemBytes).toBeInstanceOf(Uint8Array)
    })

    it('should parse issuerAuth COSE_Sign1 structure', () => {
      const response = buildMinimalDeviceResponse()
      const base64url = encodeToBase64url(response)

      const result = decodeDeviceResponse(base64url)
      const issuerAuth = result.documents[0]!.issuerSigned!.issuerAuth

      expect(issuerAuth.protectedHeaders).toBeInstanceOf(Uint8Array)
      expect(issuerAuth.protectedHeadersDecoded).toBeDefined()
      expect(issuerAuth.payload).toBeNull()
      expect(issuerAuth.signature).toBeInstanceOf(Uint8Array)
      expect(issuerAuth.unprotectedHeaders).toBeDefined()
    })

    it('should handle issuerAuth wrapped in CBOR Tag 18', () => {
      const protectedHeaders = encode(new Map([[1, -7]]))
      const unprotectedHeaders = new Map([[33, new Uint8Array([0x01])]])
      const signature = new Uint8Array(64)

      const issuerAuthTag18 = new Tag(18, [protectedHeaders, unprotectedHeaders, null, signature])

      const issuerSignedItem = new Map<string, unknown>([
        ['digestID', 0],
        ['random', new Uint8Array([0x01])],
        ['elementIdentifier', 'given_name'],
        ['elementValue', 'John'],
      ])

      const response = {
        version: '1.0',
        status: 0,
        documents: [
          {
            docType: 'org.iso.18013.5.1.mDL',
            issuerSigned: {
              nameSpaces: {
                'org.iso.18013.5.1': [new Tag(24, encode(issuerSignedItem))],
              },
              issuerAuth: issuerAuthTag18,
            },
          },
        ],
      }
      const base64url = encodeToBase64url(response)

      const result = decodeDeviceResponse(base64url)
      expect(result.documents[0]!.issuerSigned).toBeDefined()
      expect(result.documents[0]!.issuerSigned!.issuerAuth.protectedHeaders).toBeInstanceOf(Uint8Array)
    })

    it('should handle documents without issuerSigned', () => {
      const response = {
        version: '1.0',
        status: 0,
        documents: [{ docType: 'org.iso.18013.5.1.mDL' }],
      }
      const base64url = encodeToBase64url(response)

      const result = decodeDeviceResponse(base64url)
      expect(result.documents[0]!.issuerSigned).toBeUndefined()
    })

    it('should parse document errors', () => {
      const protectedHeaders = encode(new Map([[1, -7]]))
      const unprotectedHeaders = new Map([[33, new Uint8Array([0x01])]])
      const signature = new Uint8Array(64)

      const issuerSignedItem = new Map<string, unknown>([
        ['digestID', 0],
        ['random', new Uint8Array([0x01])],
        ['elementIdentifier', 'given_name'],
        ['elementValue', 'John'],
      ])

      const response = {
        version: '1.0',
        status: 0,
        documents: [
          {
            docType: 'org.iso.18013.5.1.mDL',
            issuerSigned: {
              nameSpaces: {
                'org.iso.18013.5.1': [new Tag(24, encode(issuerSignedItem))],
              },
              issuerAuth: [protectedHeaders, unprotectedHeaders, null, signature],
            },
            errors: {
              'org.iso.18013.5.1': { family_name: 1 },
            },
          },
        ],
      }
      const base64url = encodeToBase64url(response)

      const result = decodeDeviceResponse(base64url)
      expect(result.documents[0]!.errors).toBeDefined()
      expect(result.documents[0]!.errors).toHaveLength(1)
    })

    it('should parse top-level documentErrors', () => {
      const response = {
        version: '1.0',
        status: 0,
        documents: [{ docType: 'org.iso.18013.5.1.mDL' }],
        documentErrors: { 'org.iso.18013.5.1.mDL': 10 },
      }
      const base64url = encodeToBase64url(response)

      const result = decodeDeviceResponse(base64url)
      expect(result.documentErrors).toBeDefined()
      expect(result.documentErrors).toHaveLength(1)
    })

    it('should handle multiple namespaces', () => {
      const protectedHeaders = encode(new Map([[1, -7]]))
      const unprotectedHeaders = new Map([[33, new Uint8Array([0x01])]])
      const signature = new Uint8Array(64)

      const item1 = new Map<string, unknown>([
        ['digestID', 0],
        ['random', new Uint8Array([0x01])],
        ['elementIdentifier', 'family_name'],
        ['elementValue', 'Smith'],
      ])
      const item2 = new Map<string, unknown>([
        ['digestID', 1],
        ['random', new Uint8Array([0x02])],
        ['elementIdentifier', 'driving_privileges'],
        ['elementValue', 'C'],
      ])

      const response = {
        version: '1.0',
        status: 0,
        documents: [
          {
            docType: 'org.iso.18013.5.1.mDL',
            issuerSigned: {
              nameSpaces: {
                'org.iso.18013.5.1': [new Tag(24, encode(item1))],
                'org.iso.18013.5.1.aamva': [new Tag(24, encode(item2))],
              },
              issuerAuth: [protectedHeaders, unprotectedHeaders, null, signature],
            },
          },
        ],
      }
      const base64url = encodeToBase64url(response)

      const result = decodeDeviceResponse(base64url)
      const ns = result.documents[0]!.issuerSigned!.nameSpaces
      expect(Object.keys(ns)).toEqual(['org.iso.18013.5.1', 'org.iso.18013.5.1.aamva'])
      expect(ns['org.iso.18013.5.1']![0]!.issuerSignedItem.elementIdentifier).toBe('family_name')
      expect(ns['org.iso.18013.5.1.aamva']![0]!.issuerSignedItem.elementIdentifier).toBe('driving_privileges')
    })

    it('should accept all valid status codes', () => {
      for (const status of [0, 10, 11, 12]) {
        const response = {
          version: '1.0',
          status,
          documents: [{ docType: 'org.iso.18013.5.1.mDL' }],
        }
        const base64url = encodeToBase64url(response)
        const result = decodeDeviceResponse(base64url)
        expect(result.status).toBe(status)
      }
    })

    // ── Validation / error cases ──

    it('should throw on invalid status code', () => {
      const response = { version: '1.0', status: 99, documents: [{ docType: 'test' }] }
      const base64url = encodeToBase64url(response)
      expect(() => decodeDeviceResponse(base64url)).toThrow(InvariantError)
    })

    it('should throw when version is missing', () => {
      const response = { status: 0, documents: [{ docType: 'test' }] }
      const base64url = encodeToBase64url(response)
      expect(() => decodeDeviceResponse(base64url)).toThrow(InvariantError)
    })

    it('should throw when status is missing', () => {
      const response = { version: '1.0', documents: [{ docType: 'test' }] }
      const base64url = encodeToBase64url(response)
      expect(() => decodeDeviceResponse(base64url)).toThrow(InvariantError)
    })

    it('should throw when documents is missing', () => {
      const response = { version: '1.0', status: 0 }
      const base64url = encodeToBase64url(response)
      expect(() => decodeDeviceResponse(base64url)).toThrow(InvariantError)
    })

    it('should throw when document is missing docType', () => {
      const response = { version: '1.0', status: 0, documents: [{}] }
      const base64url = encodeToBase64url(response)
      expect(() => decodeDeviceResponse(base64url)).toThrow(InvariantError)
    })

    it('should throw when issuerAuth has wrong number of elements', () => {
      const response = {
        version: '1.0',
        status: 0,
        documents: [
          {
            docType: 'org.iso.18013.5.1.mDL',
            issuerSigned: {
              nameSpaces: {},
              issuerAuth: [new Uint8Array(0), {}, null],
            },
          },
        ],
      }
      const base64url = encodeToBase64url(response)
      expect(() => decodeDeviceResponse(base64url)).toThrow(InvariantError)
    })

    it('should throw when namespace items are not Tag24-wrapped', () => {
      const protectedHeaders = encode(new Map([[1, -7]]))
      const response = {
        version: '1.0',
        status: 0,
        documents: [
          {
            docType: 'org.iso.18013.5.1.mDL',
            issuerSigned: {
              nameSpaces: {
                'org.iso.18013.5.1': [{ notATag24: true }],
              },
              issuerAuth: [protectedHeaders, new Map(), null, new Uint8Array(64)],
            },
          },
        ],
      }
      const base64url = encodeToBase64url(response)
      expect(() => decodeDeviceResponse(base64url)).toThrow(InvariantError)
    })

    it('should preserve issuerSignedItemBytes for digest verification', () => {
      const response = buildMinimalDeviceResponse()
      const base64url = encodeToBase64url(response)

      const result = decodeDeviceResponse(base64url)
      const itemBytes = result.documents[0]!.issuerSigned!.nameSpaces['org.iso.18013.5.1']![0]!.issuerSignedItemBytes

      // The bytes should start with Tag24 header: 0xD8 0x18
      expect(itemBytes[0]).toBe(0xd8)
      expect(itemBytes[1]).toBe(0x18)
    })

    it('should handle issuerAuth with Uint8Array payload', () => {
      const protectedHeaders = encode(new Map([[1, -7]]))
      const unprotectedHeaders = new Map([[33, new Uint8Array([0x01])]])
      const payload = new Uint8Array([0x01, 0x02, 0x03])
      const signature = new Uint8Array(64)

      const issuerSignedItem = new Map<string, unknown>([
        ['digestID', 0],
        ['random', new Uint8Array([0x01])],
        ['elementIdentifier', 'test'],
        ['elementValue', 'val'],
      ])

      const response = {
        version: '1.0',
        status: 0,
        documents: [
          {
            docType: 'org.iso.18013.5.1.mDL',
            issuerSigned: {
              nameSpaces: {
                'org.iso.18013.5.1': [new Tag(24, encode(issuerSignedItem))],
              },
              issuerAuth: [protectedHeaders, unprotectedHeaders, payload, signature],
            },
          },
        ],
      }
      const base64url = encodeToBase64url(response)

      const result = decodeDeviceResponse(base64url)
      expect(result.documents[0]!.issuerSigned!.issuerAuth.payload).toBeInstanceOf(Uint8Array)
    })
  })
})
