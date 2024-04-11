import { lookup } from 'mime-types'
import { invariant } from './invariant'

const regex = /^data:([-\w]+\/[-+\w.]+);([-\w]+)?,(.*)/

/**
 * Parses a data URL into its components
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
 */
export function parseDataUrl(
  dataUrl: string,
  { validMimeTypes, validEncodings }: { validMimeTypes?: string[]; validEncodings?: BufferEncoding[] } = {},
) {
  // test
  if (!regex.test(dataUrl)) throw new Error('Invalid data URL')

  // parse
  const [, mimeType, encoding, data] = regex.exec(dataUrl)!
  invariant(!!mimeType && !!encoding && !!data, 'Invalid data URL')

  // validate
  if (validMimeTypes && !validMimeTypes.includes(mimeType))
    throw new Error(`Invalid data URL MIME type, received ${mimeType}, expected ${validMimeTypes.join(' or ')}`)
  if (validEncodings && !validEncodings.includes(encoding as BufferEncoding))
    throw new Error(`Invalid data URL encoding, received ${encoding}, expected ${validEncodings.join(' or ')}`)

  // return the components
  return { mimeType: mimeType as string, encoding: encoding as BufferEncoding, data: data as string }
}

/**
 * Downloads a URL and returns it as a data URL
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
 */
export async function downloadToDataUrl(url: string, init?: RequestInit) {
  const response = await fetch(url, init)
  return toDataUrl(Buffer.from(await response.arrayBuffer()), lookup(url) || 'application/octet-stream')
}

/**
 * Creates a data URL from a buffer and the specified mimetype
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
 */
export function toDataUrl(buffer: Buffer, mimeType: string, encoding: BufferEncoding = 'base64') {
  return `data:${mimeType};${encoding},${buffer.toString(encoding)}`
}
