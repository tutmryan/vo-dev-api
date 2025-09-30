import type { ServiceMock } from '../../util/jest'
import { mockFunction } from '../../util/jest'
import type { ClientSecretService } from '../client-secret-service'

export function createClientSecretServiceMock(modulePath: string, exportName: string) {
  const serviceMock: ServiceMock<ClientSecretService> = {
    get: mockFunction<ClientSecretService['get']>(),
    set: mockFunction<ClientSecretService['set']>(),
    delete: mockFunction<ClientSecretService['delete']>(),
  }

  const mockObj: any = {}
  mockObj[exportName] = jest.fn().mockImplementation(() => serviceMock)

  jest.mock(modulePath, () => mockObj)

  const helper = {
    clearAllMocks: () => {
      Object.values(serviceMock).forEach((m) => m.mockClear())
    },
    get: {
      mock: () => serviceMock.get,
      lastCallArgs: () => serviceMock.get.mock.calls.at(-1),
    },
    set: {
      mock: () => serviceMock.set,
      lastCallArgs: () => serviceMock.set.mock.calls.at(-1),
    },
    delete: {
      mock: () => serviceMock.delete,
      lastCallArgs: () => serviceMock.delete.mock.calls.at(-1),
    },
  }

  return { serviceMock, helper }
}
