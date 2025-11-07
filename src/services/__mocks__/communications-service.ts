import type { ServiceMock } from '../../util/jest'
import { mockFunction } from '../../util/jest'
import type { CommunicationsService } from '../communications-service'

const serviceMock: ServiceMock<CommunicationsService> = {
  sendIssuance: mockFunction<CommunicationsService['sendIssuance']>(),
  sendVerification: mockFunction<CommunicationsService['sendVerification']>(),
  recordCommunicationFailure: mockFunction<CommunicationsService['recordCommunicationFailure']>(),
}

jest.mock('../communications-service', () => ({
  CommunicationsService: jest.fn().mockImplementation(() => serviceMock),

  // Pass through non-mocked functions
  sendIssuanceEmail: jest.requireActual('../communications-service').sendIssuanceEmail,
  sendVerificationCodeEmail: jest.requireActual('../communications-service').sendVerificationCodeEmail,
}))

export const helper = {
  clearAllMocks: () => {
    Object.values(serviceMock).forEach((m) => m.mockClear())
  },
  sendIssuance: {
    mock: () => serviceMock.sendIssuance,
  },
  sendVerification: {
    mock: () => serviceMock.sendVerification,
  },
  recordCommunicationFailure: {
    mock: () => serviceMock.recordCommunicationFailure,
  },
}
