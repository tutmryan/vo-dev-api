import { lookup } from 'mime-types'

// these fake data urls functions are designed to provide deterministic test results converting between uris and data urls

export const fakeBlobStorageHost = 'https://mock.blob.net'

export function fakeJpegDataURL(data: string = 'jpeg123==') {
  return `data:image/jpeg;base64,${data}`
}

export function fakePngDataURL(data: string = 'png123==') {
  return `data:image/png;base64,${data}`
}

export function fakeDownloadToDataURL(uri: string) {
  const [name] = uri.replace(`${fakeBlobStorageHost}/`, '').split('.')
  return `data:${lookup(uri)};base64,${name}`
}
