import '../services/__mocks__/blob-storage-container-service'
import { fakeDownloadToDataURL } from './data-url'
import { helper as mockAdminServiceHelper } from '../services/__mocks__/verified-id'
import { helper as mockRequestServiceHelper } from '../services/__mocks__/verified-request'
import { helper as mockBlobStorageContainerServiceHelper } from '../services/__mocks__/blob-storage-container-service'
import { helper as mockAsyncIssuanceService } from '../services/__mocks__/async-issuance-service'

export const mockDownloadToDataURL = jest.fn(fakeDownloadToDataURL)

export const mockServiceUtil = {
  clearAllMocks: () => {
    mockBlobStorageContainerServiceHelper.clearAllMocks()
    mockAdminServiceHelper.clearAllMocks()
    mockRequestServiceHelper.clearAllMocks()
    mockAsyncIssuanceService.clearAllMocks()
  },
  adminService: {
    ...mockAdminServiceHelper,
  },
  requestService: {
    ...mockRequestServiceHelper,
  },
  blobStorageContainerService: {
    ...mockBlobStorageContainerServiceHelper,
  },
  asyncIssuanceService: {
    ...mockAsyncIssuanceService,
  },
}

export function mockServices() {
  jest.mock('../services/blob-storage-container-service')
  jest.mock('../services/async-issuance-service')
  jest.mock('../services/verified-id')
  jest.mock('../util/data-url', () => {
    const originalModule = jest.requireActual('../util/data-url')
    return {
      ...originalModule,
      downloadToDataUrl: mockDownloadToDataURL,
    }
  })
}
