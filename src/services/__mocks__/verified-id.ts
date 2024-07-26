import casual from 'casual'
import { randomUUID } from 'crypto'
import { DidDocumentStatus } from '../../generated/graphql'
import type { AwaitedReturnTypeOf } from '../../util/type-helpers'
import type { VerifiedIdAdminService } from '../verified-id'

type ServiceReturn<Method extends keyof VerifiedIdAdminService> = AwaitedReturnTypeOf<VerifiedIdAdminService, Method>

const mockCreateContract = jest.fn()
const mockUpdateContract = jest.fn()
const mockContract = jest.fn()
const mockAuthority = jest.fn()

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

const mock = jest.mock('../verified-id/admin', () => ({
  VerifiedIdAdminService: jest.fn().mockImplementation(() => ({
    createContract: mockCreateContract,
    updateContract: mockUpdateContract,
    contract: mockContract,
    authority: mockAuthority,
  })),
}))

export const helper = {
  clearAllMocks: mock.clearAllMocks,
  updateContract: {
    mock: mockUpdateContract,
  },
  createContract: {
    mock: mockCreateContract,
    resolveWith: (v: ServiceReturn<'createContract'>) => mockCreateContract.mockResolvedValue(v),
    buildResolve: buildCreateContractReturn,
  },
  contract: {
    mock: mockContract,
    resolvedWith: (v: ServiceReturn<'contract'>) => mockContract.mockResolvedValue(v),
    buildResolve: buildContractReturn,
  },
  authority: {
    mock: mockAuthority,
    resolvedWith: (v: ServiceReturn<'authority'>) => mockAuthority.mockResolvedValue(v),
    buildResolve: buildAuthorityReturn,
  },
}
