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
