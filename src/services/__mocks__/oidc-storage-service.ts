import type { ServiceMock } from '../../util/jest'
import { mockFunction } from '../../util/jest'
import type { OidcStorageService } from '../oidc-storage-service'

const serviceMock: ServiceMock<
  Omit<
    OidcStorageService,
    'upload' | 'downloadToBuffer' | 'containerClient' | 'uploadDataUrl' | 'exists' | 'deleteIfExists' | 'getProperties' | 'listAllBlobsFlat'
  >
> = {
  uploadAccount: mockFunction<OidcStorageService['uploadAccount']>(),
  downloadAccount: mockFunction<OidcStorageService['downloadAccount']>(),
  deleteAccountIfExists: mockFunction<OidcStorageService['deleteAccountIfExists']>(),
  loadExistingKeys: mockFunction<OidcStorageService['loadExistingKeys']>(),
  initialiseKeysFromDeduplicatedBackgroundJob: mockFunction<OidcStorageService['initialiseKeysFromDeduplicatedBackgroundJob']>(),
}

jest.mock('../oidc-storage-service', () => ({
  OidcStorageService: jest.fn().mockImplementation(() => serviceMock),
}))

export const helper = {
  clearAllMocks: () => {
    Object.values(serviceMock).forEach((m) => m.mockClear())
  },
  uploadAccount: {
    mock: () => serviceMock.uploadAccount,
  },
  downloadAccount: {
    mock: () => serviceMock.downloadAccount,
  },
  deleteAccountIfExists: {
    mock: () => serviceMock.deleteAccountIfExists,
  },
  loadExistingKeys: {
    mock: () => serviceMock.loadExistingKeys,
  },
  initialiseKeysFromDeduplicatedBackgroundJob: {
    mock: () => serviceMock.initialiseKeysFromDeduplicatedBackgroundJob,
  },
}
