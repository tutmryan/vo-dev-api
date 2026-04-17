import type { HttpClient } from '@makerx/node-common/http'
import casual from 'casual'
import { randomUUID } from 'crypto'
import { addYears } from 'date-fns'
import type { IssuanceResponse } from '../../generated/graphql'
import type { ServiceMock } from '../../util/jest'
import { mockFunction } from '../../util/jest'
import type { AwaitedReturnTypeOf } from '../../util/type-helpers'
import type { IssuanceRequest, VerifiedIdRequestService } from '../verified-id'

type ServiceReturn<Method extends keyof VerifiedIdRequestService> = AwaitedReturnTypeOf<VerifiedIdRequestService, Method>

const buildCreateIssuanceRequestReturn = (mockedResult?: Partial<IssuanceResponse>): ServiceReturn<'createIssuanceRequest'> => ({
  requestId: randomUUID(),
  expiry: addYears(new Date(), 1).getTime(),
  qrCode: `data:image/png;base64${randomUUID()}`,
  url: casual.url,
  credentialRecordId: randomUUID(),
  ...mockedResult,
})

const serviceMock: ServiceMock<VerifiedIdRequestService, keyof HttpClient> = {
  createIssuanceRequest: mockFunction<VerifiedIdRequestService['createIssuanceRequest']>(),
  createPresentationRequest: mockFunction<VerifiedIdRequestService['createPresentationRequest']>(),
}

jest.mock('../verified-id/request', () => ({
  VerifiedIdRequestService: jest.fn().mockImplementation(() => serviceMock),
}))

export const helper = {
  clearAllMocks: () => {
    Object.values(serviceMock).forEach((m) => m.mockClear())
  },
  createIssuanceRequest: {
    mock: () => serviceMock.createIssuanceRequest,
    resolveWith: (v: ServiceReturn<'createIssuanceRequest'>) => serviceMock.createIssuanceRequest.mockResolvedValue(v),
    buildResolve: buildCreateIssuanceRequestReturn,
    getLastCallArg: () =>
      serviceMock.createIssuanceRequest.mock.calls[serviceMock.createIssuanceRequest.mock.calls.length - 1]![0] as IssuanceRequest,
  },
}
