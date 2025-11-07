import { helper as asyncIssuanceServiceHelper } from '../services/__mocks__/async-issuance-service'
import { helper as blobStorageContainerServiceHelper } from '../services/__mocks__/blob-storage-container-service'
import { helper as communicationServiceHelper } from '../services/__mocks__/communications-service'
import { helper as identityStoreSecretServiceHelper } from '../services/__mocks__/identity-store-secret-service'
import { helper as oidcSecretServiceHelper } from '../services/__mocks__/oidc-secret-service'
import { helper as oidcStorageServiceHelper } from '../services/__mocks__/oidc-storage-service'
import { helper as adminServiceMockHelper } from '../services/__mocks__/verified-id'
import { helper as verifiedRequestServiceMockHelper } from '../services/__mocks__/verified-request'
import { fakeDownloadToDataURL } from './data-url'

export const mockedServices = {
  clearAllMocks: () => {
    blobStorageContainerServiceHelper.clearAllMocks()
    adminServiceMockHelper.clearAllMocks()
    verifiedRequestServiceMockHelper.clearAllMocks()
    asyncIssuanceServiceHelper.clearAllMocks()
    communicationServiceHelper.clearAllMocks()
    oidcStorageServiceHelper.clearAllMocks()
    oidcSecretServiceHelper.clearAllMocks()
    identityStoreSecretServiceHelper.clearAllMocks()
  },
  adminService: adminServiceMockHelper,
  requestService: verifiedRequestServiceMockHelper,
  blobStorageContainerService: blobStorageContainerServiceHelper,
  asyncIssuanceService: asyncIssuanceServiceHelper,
  communicationsService: communicationServiceHelper,
  oidcStorageService: oidcStorageServiceHelper,
  oidcSecretService: oidcSecretServiceHelper,
  identityStoreSecretService: identityStoreSecretServiceHelper,
}

export const sendEmailMock = jest.fn()

export function loadMocks() {
  // Note: imports ../services/__mocks__/* have side effects
  jest.mock('../background-jobs/index')
  jest.mock('../util/data-url', () => {
    const originalModule = jest.requireActual('../util/data-url')
    return {
      ...originalModule,
      downloadToDataUrl: jest.fn(fakeDownloadToDataURL),
    }
  })
  jest.mock('../util/email', () => ({
    sendEmail: sendEmailMock,
    // Pass through other util email functions
    toUserErrorMessage: jest.requireActual('../util/email').toUserErrorMessage,
    extractEmails: jest.requireActual('../util/email').extractEmails,
  }))
}
