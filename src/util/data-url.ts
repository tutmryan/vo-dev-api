import { lookup } from 'mime-types'

const regex = /^data:([-\w]+\/[-+\w.]+);([-\w]+)?,(.*)/

/**
 * Parses a data URL into its components
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
 */
export function parseDataUrl(dataUrl: string) {
  if (!regex.test(dataUrl)) throw new Error('Invalid data URL')
  const [, mimeType, encoding, data] = regex.exec(dataUrl)!
  return { mimeType: mimeType as string, encoding: encoding as BufferEncoding, data: data as string }
}

/**
 * Downloads a URL and returns it as a data URL
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
 */
export async function downloadToDataUrl(url: string) {
  const response = await fetch(url)
  return toDataUrl(Buffer.from(await response.arrayBuffer()), lookup(url) || 'application/octet-stream')
}

/**
 * Creates a data URL from a buffer and the specified mimetype
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
 */
export function toDataUrl(buffer: Buffer, mimeType: string, encoding: BufferEncoding = 'base64') {
  return `data:${mimeType};${encoding},${buffer.toString(encoding)}`
}

export function toBase64UrlWithoutMimeType(base64Image: string) {
  let base64Data = base64Image
  const components = base64Image.split(',')
  if (components.length > 1 && components[1]) {
    base64Data = components[1]
  }
  const buffer = Buffer.from(base64Data!, 'base64')
  return buffer.toString('base64url')
}
