import type { HttpClient } from '@makerx/node-common/http'
import casual from 'casual'
import { randomUUID } from 'crypto'
import { DidDocumentStatus } from '../../generated/graphql'
import type { ServiceMock } from '../../util/jest'
import { mockFunction } from '../../util/jest'
import type { AwaitedReturnTypeOf } from '../../util/type-helpers'
import type { VerifiedIdAdminService } from '../verified-id'

type ServiceReturn<Method extends keyof VerifiedIdAdminService> = AwaitedReturnTypeOf<VerifiedIdAdminService, Method>

const buildContractReturn = (mockedResult?: Partial<ServiceReturn<'contract'>>): ServiceReturn<'contract'> => ({
  id: randomUUID(),
  name: casual.word,
  status: 'active',
  manifestUrl: casual.url,
  availableInVcDirectory: true,
  rules: {
    attestations: {
      idTokenHints: [],
    },
    validityInterval: 0,
    vc: {
      type: [],
    },
  },
  displays: [],
  allowOverrideValidityIntervalOnIssuance: false,
  ...mockedResult,
})

const buildAuthorityReturn = (mockedResult?: Partial<ServiceReturn<'authority'>>): ServiceReturn<'authority'> => ({
  id: randomUUID(),
  name: casual.word,
  linkedDomainsVerified: true,
  didModel: {
    did: randomUUID(),
    didDocumentStatus: DidDocumentStatus.Published,
    linkedDomainUrls: [casual.url],
  },
  ...mockedResult,
})

const buildCreateContractReturn = (mockedResult?: Partial<ServiceReturn<'createContract'>>): ServiceReturn<'createContract'> => ({
  id: randomUUID(),
  name: casual.word,
  status: 'active',
  manifestUrl: casual.url,
  availableInVcDirectory: true,
  allowOverrideValidityIntervalOnIssuance: true,
  displays: [],
  rules: {
    attestations: {
      idTokenHints: [],
    },
    validityInterval: 0,
    vc: {
      type: [],
    },
  },
  ...mockedResult,
})

const serviceMock: ServiceMock<VerifiedIdAdminService, keyof HttpClient> = {
  createContract: mockFunction<VerifiedIdAdminService['createContract']>(),
  updateContract: mockFunction<VerifiedIdAdminService['updateContract']>(),
  contracts: mockFunction<VerifiedIdAdminService['contracts']>(),
  contract: mockFunction<VerifiedIdAdminService['contract']>(),
  findNetworkIssuers: mockFunction<VerifiedIdAdminService['findNetworkIssuers']>(),
  networkContracts: mockFunction<VerifiedIdAdminService['networkContracts']>(),
  findCredential: mockFunction<VerifiedIdAdminService['findCredential']>(),
  revokeCredential: mockFunction<VerifiedIdAdminService['revokeCredential']>(),
  authority: mockFunction<VerifiedIdAdminService['authority']>(),
}

jest.mock('../verified-id/admin', () => ({
  VerifiedIdAdminService: jest.fn().mockImplementation(() => serviceMock),
}))

export const helper = {
  clearAllMocks: () => {
    Object.values(serviceMock).forEach((m) => m.mockClear())
  },
  updateContract: {
    mock: () => serviceMock.updateContract,
  },
  createContract: {
    mock: () => serviceMock.createContract,
    resolveWith: (v: ServiceReturn<'createContract'>) => serviceMock.createContract.mockResolvedValue(v),
    buildResolve: buildCreateContractReturn,
  },
  contract: {
    mock: () => serviceMock.contract,
    resolvedWith: (v: ServiceReturn<'contract'>) => serviceMock.contract.mockResolvedValue(v),
    buildResolve: buildContractReturn,
  },
  authority: {
    mock: () => serviceMock.authority,
    resolvedWith: (v: ServiceReturn<'authority'>) => serviceMock.authority.mockResolvedValue(v),
    buildResolve: buildAuthorityReturn,
  },
}
