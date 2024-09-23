import mime from 'mime'
import { fakeBlobStorageHost } from '../../test/data-url'
import { parseDataUrl } from '../../util/data-url'

const mockUploadDataUrl = jest.fn()
const mockUpload = jest.fn()
const mockDownloadToBuffer = jest.fn()
const mockDeleteIfExists = jest.fn()
const mockGetProperties = jest.fn()

const buildUploadDataUrl = (blobName: string, dataUrl: string): Promise<string> => {
  const { mimeType, data } = parseDataUrl(dataUrl)
  // using the data for the name provides us a deterministic url based on input
  const name = `${data}.${mime.extension(mimeType)}`
  return Promise.resolve([fakeBlobStorageHost, name].join('/'))
}

export const mock = jest.mock('../blob-storage-container-service', () => ({
  BlobStorageContainerService: jest.fn().mockImplementation(() => ({
    uploadDataUrl: mockUploadDataUrl,
    upload: mockUpload,
    downloadToBuffer: mockDownloadToBuffer,
    deleteIfExists: mockDeleteIfExists,
    getProperties: mockGetProperties,
  })),
}))

export const helper = {
  clearAllMocks: mock.clearAllMocks,
  uploadDataUrl: {
    mock: mockUploadDataUrl,
    resolveWith: (v: Promise<string>) => mockUploadDataUrl.mockResolvedValue(v),
    buildResolve: buildUploadDataUrl,
    dynamicResolveWith: (fn: (blobName: string, dataUrl: string) => Promise<string>) => mockUploadDataUrl.mockImplementation(fn),
  },
  upload: {
    mock: mockUpload,
  },
  deleteIfExists: {
    mock: mockDeleteIfExists,
  },
  downloadToBuffer: {
    mock: mockDownloadToBuffer,
  },
}
