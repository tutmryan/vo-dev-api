import mime from 'mime'
import { fakeBlobStorageHost } from '../../test/data-url'
import { parseDataUrl } from '../../util/data-url'

export const mockDeleteIfExists = jest.fn()
export const mockUploadDataUrl = jest.fn((blobName: string, dataUrl: string) => {
  const { mimeType, data } = parseDataUrl(dataUrl)
  // using the data for the name provides us a deterministic url based on input
  const name = `${data}.${mime.extension(mimeType)}`
  return [fakeBlobStorageHost, name].join('/')
})
export const mock = jest.mock('../blob-storage-container-service', () => ({
  BlobStorageContainerService: jest.fn().mockImplementation(() => ({
    deleteIfExists: mockDeleteIfExists,
    uploadDataUrl: mockUploadDataUrl,
  })),
}))
