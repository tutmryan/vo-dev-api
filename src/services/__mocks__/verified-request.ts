import casual from 'casual'
import { randomUUID } from 'crypto'
import { addYears } from 'date-fns'
import type { AwaitedReturnTypeOf } from '../../util/type-helpers'
import type { IssuanceRequest, VerifiedIdRequestService } from '../verified-id'
import type { IssuanceResponse } from '../../generated/graphql'

type ServiceReturn<Method extends keyof VerifiedIdRequestService> = AwaitedReturnTypeOf<VerifiedIdRequestService, Method>

const mockCreateIssuanceRequest = jest.fn()

const buildCreateIssuanceRequestReturn = (mockedResult?: IssuanceResponse): ServiceReturn<'createIssuanceRequest'> => ({
  requestId: randomUUID(),
  expiry: addYears(new Date(), 1).getTime(),
  qrCode: `data:image/png;base64${randomUUID()}`,
  url: casual.url,
  ...mockedResult,
})

const mock = jest.mock('../verified-id/request', () => ({
  VerifiedIdRequestService: jest.fn().mockImplementation(() => ({
    createIssuanceRequest: mockCreateIssuanceRequest,
  })),
}))

export const helper = {
  clearAllMocks: mock.clearAllMocks,
  createIssuanceRequest: {
    mock: mockCreateIssuanceRequest,
    resolveWith: (v: ServiceReturn<'createIssuanceRequest'>) => mockCreateIssuanceRequest.mockResolvedValue(v),
    buildResolve: buildCreateIssuanceRequestReturn,
    getLastCallArg: () => mockCreateIssuanceRequest.mock.calls[mockCreateIssuanceRequest.mock.calls.length - 1][0] as IssuanceRequest,
  },
}
