import { downloadToDataUrl, parseDataUrl } from './data-url'

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

describe('downloadToDataUrl', () => {
  it('downloads the data URL', async () => {
    const output = await downloadToDataUrl(
      'https://vodevvrfdorchstnst.blob.core.windows.net/logo-images/AA7ED447-232D-400A-9D96-BD0C9F4E108D.png',
    )
    expect(output.startsWith('data:image/png;base64,iVBORw0K')).toBe(true)
  })
})
