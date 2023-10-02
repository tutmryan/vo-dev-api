import { parseDataUrl } from './data-url'

describe('parseDataUrl', () => {
  it('returns the mimeType, encoding and data', () => {
    const output = parseDataUrl('data:image/png;base64,SGVsbG8sIFdvcmxkIQ==')
    expect(output).toMatchInlineSnapshot(`
      {
        "data": "SGVsbG8sIFdvcmxkIQ==",
        "encoding": "base64",
        "mimeType": "image/png",
      }
    `)
  })

  it('throws an error when the data URL is invalid', () => {
    expect(() => parseDataUrl('image/png;base64,SGVsbG8sIFdvcmxkIQ==')).toThrowErrorMatchingInlineSnapshot(`"Invalid data URL"`)
  })
})
