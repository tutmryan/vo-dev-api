import type { AsyncIssuanceRequestInput } from '../../generated/graphql'
import type { ServiceMock } from '../../util/jest'
import { mockFunction } from '../../util/jest'
import { throwError } from '../../util/throw-error'
import type { AsyncIssuanceService } from '../async-issuance-service'

const serviceMock: ServiceMock<AsyncIssuanceService> = {
  uploadAsyncIssuance: mockFunction<AsyncIssuanceService['uploadAsyncIssuance']>(),
  downloadAsyncIssuance: mockFunction<AsyncIssuanceService['downloadAsyncIssuance']>(),
  deleteAsyncIssuanceIfExists: mockFunction<AsyncIssuanceService['deleteAsyncIssuanceIfExists']>(),
  containerClient: mockFunction<AsyncIssuanceService['containerClient']>(),
  upload: mockFunction<AsyncIssuanceService['upload']>(),
  downloadToBuffer: mockFunction<AsyncIssuanceService['downloadToBuffer']>(),
  getProperties: mockFunction<AsyncIssuanceService['getProperties']>(),
  deleteIfExists: mockFunction<AsyncIssuanceService['deleteIfExists']>(),
  uploadDataUrl: mockFunction<AsyncIssuanceService['uploadDataUrl']>(),
  exists: mockFunction<AsyncIssuanceService['exists']>(),
}

jest.mock('../async-issuance-service', () => ({
  AsyncIssuanceService: jest.fn().mockImplementation(() => serviceMock),
}))

export const helper = {
  clearAllMocks: () => {
    Object.values(serviceMock).forEach((m) => m.mockClear())
  },
  uploadAsyncIssuance: {
    mock: () => serviceMock.uploadAsyncIssuance,
    previousAsyncIssuanceCallArgResolver: () => () =>
      serviceMock.uploadAsyncIssuance.mock.calls.map((args) => args[1])[0] ?? throwError('No previous call'),
  },
  downloadAsyncIssuance: {
    mock: () => serviceMock.downloadAsyncIssuance,
    resolveWithCallArgsResolver: (v: () => AsyncIssuanceRequestInput) =>
      serviceMock.downloadAsyncIssuance.mockImplementation(() => {
        return Promise.resolve(v())
      }),
  },
  deleteAsyncIssuanceIfExists: {
    mock: () => serviceMock.deleteAsyncIssuanceIfExists,
  },
}
