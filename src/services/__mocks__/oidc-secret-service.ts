import type { ServiceMock } from '../../util/jest'
import { mockFunction } from '../../util/jest'
import type { OidcSecretService } from '../oidc-secret-service'

const serviceMock: ServiceMock<OidcSecretService> = {
  getClientSecret: mockFunction<OidcSecretService['getClientSecret']>(),
  setClientSecret: mockFunction<OidcSecretService['setClientSecret']>(),
  deleteClientSecret: mockFunction<OidcSecretService['deleteClientSecret']>(),
}

jest.mock('../oidc-secret-service', () => ({
  createOidcSecretService: jest.fn().mockImplementation(() => serviceMock),
}))

export const helper = {
  clearAllMocks: () => {
    Object.values(serviceMock).forEach((m) => m.mockClear())
  },
  getClientSecret: {
    mock: () => serviceMock.getClientSecret,
  },
  setClientSecret: {
    mock: () => serviceMock.setClientSecret,
    lastCallArgs: () => serviceMock.setClientSecret.mock.calls[serviceMock.setClientSecret.mock.calls.length - 1],
  },
  deleteClientSecret: {
    mock: () => serviceMock.deleteClientSecret,
    lastCallArgs: () => serviceMock.deleteClientSecret.mock.calls[serviceMock.deleteClientSecret.mock.calls.length - 1],
  },
}
