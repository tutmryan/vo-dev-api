import { fakeDownloadToDataURL } from './data-url'
import { helper as adminServiceMockHelper } from '../services/__mocks__/verified-id'
import { helper as verifiedRequestServiceMockHelper } from '../services/__mocks__/verified-request'
import { helper as blobStorageContainerServiceHelper } from '../services/__mocks__/blob-storage-container-service'
import { helper as asyncIssuanceServiceHelper } from '../services/__mocks__/async-issuance-service'
import { helper as communicationServiceHelper } from '../services/__mocks__/communications-service'

export const mockedServices = {
  clearAllMocks: () => {
    blobStorageContainerServiceHelper.clearAllMocks()
    adminServiceMockHelper.clearAllMocks()
    verifiedRequestServiceMockHelper.clearAllMocks()
    asyncIssuanceServiceHelper.clearAllMocks()
    communicationServiceHelper.clearAllMocks()
  },
  adminService: adminServiceMockHelper,
  requestService: verifiedRequestServiceMockHelper,
  blobStorageContainerService: blobStorageContainerServiceHelper,
  asyncIssuanceService: asyncIssuanceServiceHelper,
  communicationsService: communicationServiceHelper,
}

export function loadMocks() {
  // Note: imports ../services/__mocks__/* have side effects
  jest.mock('../background-jobs/queue')
  jest.mock('../util/data-url', () => {
    const originalModule = jest.requireActual('../util/data-url')
    return {
      ...originalModule,
      downloadToDataUrl: jest.fn(fakeDownloadToDataURL),
    }
  })
}
