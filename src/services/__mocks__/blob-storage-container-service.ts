import mime from 'mime-types'
import { fakeBlobStorageHost } from '../../test/data-url'
import { parseDataUrl } from '../../util/data-url'
import type { ServiceMock } from '../../util/jest'
import { mockFunction } from '../../util/jest'
import type { BlobStorageContainerService } from '../blob-storage-container-service'

const buildUploadDataUrl = (blobName: string, dataUrl: string): Promise<string> => {
  const { mimeType, data } = parseDataUrl(dataUrl)
  // using the data for the name provides us a deterministic url based on input
  const name = `${data}.${mime.extension(mimeType)}`
  return Promise.resolve([fakeBlobStorageHost, name].join('/'))
}

const serviceMock: ServiceMock<BlobStorageContainerService> = {
  uploadDataUrl: mockFunction<BlobStorageContainerService['uploadDataUrl']>(),
  upload: mockFunction<BlobStorageContainerService['upload']>(),
  downloadToBuffer: mockFunction<BlobStorageContainerService['downloadToBuffer']>(),
  deleteIfExists: mockFunction<BlobStorageContainerService['deleteIfExists']>(),
  getProperties: mockFunction<BlobStorageContainerService['getProperties']>(),
  containerClient: mockFunction<BlobStorageContainerService['containerClient']>(),
  exists: mockFunction<BlobStorageContainerService['exists']>(),
  listAllBlobsFlat: mockFunction<BlobStorageContainerService['listAllBlobsFlat']>(),
}

jest.mock('../blob-storage-container-service', () => ({
  BlobStorageContainerService: jest.fn().mockImplementation(() => serviceMock),
}))

export const helper = {
  clearAllMocks: () => {
    Object.values(serviceMock).forEach((m) => m.mockClear())
  },
  uploadDataUrl: {
    mock: () => serviceMock.uploadDataUrl,
    buildResolve: buildUploadDataUrl,
    dynamicResolveWith: (fn: (blobName: string, dataUrl: string) => Promise<string>) => serviceMock.uploadDataUrl.mockImplementation(fn),
  },
  upload: {
    mock: () => serviceMock.upload,
  },
  deleteIfExists: {
    mock: () => serviceMock.deleteIfExists,
  },
  downloadToBuffer: {
    mock: () => serviceMock.downloadToBuffer,
  },
}
