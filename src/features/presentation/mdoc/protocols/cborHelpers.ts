import { decode, type ITag, type TagDecoder, type TagNumber } from 'cbor2'
import { invariant } from '../../../../util/invariant'
import type { MDocDeviceResponse, MDocDocument, MDocIssuerSigned, MDocNamespaceItem, MDocResponseStatus } from '../types'
import { mDocResponseStatus } from '../types'

// ── Tag24 Wrapper Type ──

type Tag24Wrapper = {
  isTag24Wrapper: true
  rawBytes: Uint8Array
  decoded: unknown
}

function isTag24Wrapper(value: unknown): value is Tag24Wrapper {
  return typeof value === 'object' && value !== null && 'isTag24Wrapper' in value && value.isTag24Wrapper === true
}

// ── Tag24 Extraction ──

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
  const innerContentBuffer = Buffer.from(innerContentBytes)
  const contentStartIndex = sourceBytes.indexOf(
    new Uint8Array(innerContentBuffer.buffer, innerContentBuffer.byteOffset, innerContentBuffer.byteLength),
  )

  invariant(
    contentStartIndex !== -1,
    `Inner content bytes not found in source CBOR buffer. ` +
      `Looking for ${innerContentBuffer.length} bytes: ${innerContentBuffer.toString('hex').slice(0, 100)}...`,
  )

  const contentLength = innerContentBytes.length

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

  const tag24HeaderLength = 2
  const headerStartIndex = contentStartIndex - byteStringHeaderLength - tag24HeaderLength

  invariant(
    headerStartIndex >= 0,
    `Calculated header start index is negative (${headerStartIndex}). Content starts at ${contentStartIndex}.`,
  )

  invariant(
    sourceBytes[headerStartIndex] === 0xd8 && sourceBytes[headerStartIndex + 1] === 0x18,
    `Expected Tag24 header (0xD8 0x18) at index ${headerStartIndex}, ` +
      `found: ${sourceBytes[headerStartIndex]?.toString(16)} ${sourceBytes[headerStartIndex + 1]?.toString(16)}`,
  )

  const totalLength = tag24HeaderLength + byteStringHeaderLength + contentLength
  const completeTag24Bytes = sourceBytes.subarray(headerStartIndex, headerStartIndex + totalLength)

  return new Uint8Array(completeTag24Bytes.buffer, completeTag24Bytes.byteOffset, completeTag24Bytes.byteLength)
}

// ── CBOR Decoding ──

export function decodeCbor(source: Buffer | string) {
  const sourceBytes = typeof source === 'string' ? Buffer.from(source) : Buffer.from(source.buffer, source.byteOffset, source.byteLength)

  return decode(new Uint8Array(sourceBytes.buffer, sourceBytes.byteOffset, sourceBytes.byteLength), {
    tags: new Map<TagNumber, TagDecoder>([
      [
        24,
        (tag: ITag) => {
          const rawBytes = tag.contents as Uint8Array
          try {
            const decoded = decode(rawBytes, {
              tags: new Map<TagNumber, TagDecoder>([
                [
                  1004,
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
          } catch {
            return rawBytes
          }
        },
      ],
    ]),
  })
}

// ── DeviceResponse Decoding ──

export function decodeDeviceResponse(cborEncodedResponse: string): MDocDeviceResponse {
  const responseBuffer = Buffer.from(cborEncodedResponse, 'base64url')
  const decodedResponse = decodeCbor(responseBuffer)

  invariant(typeof decodedResponse === 'object' && decodedResponse !== null, 'Invalid DeviceResponse structure')
  invariant('version' in decodedResponse && typeof decodedResponse.version === 'string', 'DeviceResponse.version missing')
  invariant('status' in decodedResponse && typeof decodedResponse.status === 'number', 'DeviceResponse.status missing')
  invariant(Object.values(mDocResponseStatus).includes(decodedResponse.status as MDocResponseStatus), 'DeviceResponse.status invalid')
  invariant('documents' in decodedResponse && Array.isArray(decodedResponse.documents), 'DeviceResponse.documents missing')

  const documents = decodedResponse.documents.map((doc: unknown) => {
    invariant(typeof doc === 'object' && doc !== null, 'Invalid document in DeviceResponse.documents')
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
              invariant(isTag24Wrapper(wrappedItem), 'Invalid Tag24Wrapper structure')

              const item = wrappedItem.decoded
              const issuerSignedItemBytes = extractTag24Bytes(responseBuffer, wrappedItem.rawBytes)

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
      let issuerAuthArray = doc.issuerSigned.issuerAuth as unknown
      const issuerAuthObj = issuerAuthArray as { tag?: number; contents?: unknown } | undefined
      if (issuerAuthObj?.tag === 18 && Array.isArray(issuerAuthObj.contents)) {
        issuerAuthArray = issuerAuthObj.contents
      }
      invariant(Array.isArray(issuerAuthArray), 'document.issuerSigned.issuerAuth invalid (not an array or Tag 18)')
      invariant(issuerAuthArray.length === 4, 'document.issuerSigned.issuerAuth must be a COSE_Sign1 array with 4 elements')

      const [protectedHeaders, unprotectedHeaders, payload, signature] = issuerAuthArray

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
  if ('documentErrors' in decodedResponse && decodedResponse.documentErrors) {
    invariant(typeof decodedResponse.documentErrors === 'object', 'DeviceResponse.documentErrors must be an object')
    documentErrors = [decodedResponse.documentErrors as { [docType: string]: number }]
  }

  return {
    version: decodedResponse.version as string,
    status: decodedResponse.status as MDocResponseStatus,
    documents,
    documentErrors,
  }
}
