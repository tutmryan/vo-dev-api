import { graphql } from '../../../generated'
import { AsyncIssuanceRequestExpiry } from '../../../generated/graphql'
import {
  beforeAfterAll,
  executeOperationAsIssuee,
  expectResponseUnionToBe,
  expectToBeDefinedAndNotNull,
  expectToBeUndefined,
  expectUnauthorizedError,
} from '../../../test'
import { mockedServices } from '../../../test/mocks'
import { buildContact, executeCreateAsyncIssuanceRequestAsIssuer, givenContract } from '../../async-issuance/tests/index'
import { createIdentity } from '../../identity/tests/create-identity'

const discoveryQuery = graphql(
  `
  query Discovery{
    discovery {
      version
    }
  }
` as const,
)

const authorityQuery = graphql(
  `
  query Authority {
    authority {
      id
    }
  }
` as const,
)

const meQuery = graphql(
  `
query Me {
  me {
    ... on Identity {
      presentations {
        id
      }
      issuances {
        id
      }
      asyncIssuanceRequests {
        id
      }
    }
  }
}
` as const,
)

const asyncIssuanceRequestsQuery = graphql(
  `
query AsyncIssuanceRequest($asyncIssuanceRequestId: UUID!) {
  asyncIssuanceRequest(id: $asyncIssuanceRequestId) {
    id
  }
}
` as const,
)

const createPartnerMutation = graphql(`
  mutation CreatePartnerIdentityTest($input: CreatePartnerInput!) {
    createPartner(input: $input) {
      id
      did
      name
    }
  }
`)

function withMockedServices() {
  mockedServices.adminService.contract.resolvedWith(mockedServices.adminService.contract.buildResolve())
  mockedServices.adminService.authority.resolvedWith(mockedServices.adminService.authority.buildResolve())
  mockedServices.requestService.createIssuanceRequest.resolveWith(mockedServices.requestService.createIssuanceRequest.buildResolve())
  mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
    mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
  )
}

describe('oidc identity issuee', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()
  })
  it.each([
    ['discovery', discoveryQuery],
    ['authority', authorityQuery],
    ['meQuery', meQuery],
  ])('allows to query %s', async (_name, query) => {
    withMockedServices()
    const identity = await createIdentity()
    const { errors, data } = await executeOperationAsIssuee({ query }, identity.id)
    expect(errors).toBeUndefined()
    expectToBeDefinedAndNotNull(data)
  })

  it('can query for async issuance requests', async () => {
    // Arrange
    withMockedServices()
    const { contract } = await givenContract({})
    const identity = await createIdentity()

    // Set up the async issuance request for the oidc identity
    const asyncIssuanceRequestInput = {
      contractId: contract.id,
      identityId: identity.id,
      expiry: AsyncIssuanceRequestExpiry.OneDay,
      contact: buildContact(),
    }

    const { errors, data } = await executeCreateAsyncIssuanceRequestAsIssuer([asyncIssuanceRequestInput])
    expect(errors).toBeUndefined()
    expectToBeUndefined(errors)
    expectToBeDefinedAndNotNull(data)
    expectResponseUnionToBe(data.createAsyncIssuanceRequest, 'AsyncIssuanceResponse')
    expect(data.createAsyncIssuanceRequest.asyncIssuanceRequestIds).toHaveLength(1)

    // Act: Query for async issuance request
    const asyncIssuanceRequestId = data?.createAsyncIssuanceRequest.asyncIssuanceRequestIds[0]

    expect(asyncIssuanceRequestId).toBeDefined()

    if (!asyncIssuanceRequestId) {
      throw new Error('asyncIssuanceRequestId is undefined!')
    }

    const { errors: queryError, data: queryData } = await executeOperationAsIssuee(
      { query: asyncIssuanceRequestsQuery, variables: { asyncIssuanceRequestId } },
      identity.id,
    )
    expectToBeDefinedAndNotNull(queryData)
    expect(queryError).toBeUndefined()
  })

  it('can not create e.g. a partner', async () => {
    const identity = await createIdentity()
    const input = {
      input: {
        name: 'Test Partner',
        did: 'did:identity-test-example:123456789',
        credentialTypes: ['type1', 'type2'],
        tenantId: '36faedc5-b6f9-4c4e-a514-b925df3447ee',
        issuerId: 'ea555a2b-65da-4263-b280-7618b6555017',
        linkedDomainUrls: ['https://example.com'],
      },
    }
    const { errors } = await executeOperationAsIssuee({ query: createPartnerMutation, variables: input }, identity.id)
    expectUnauthorizedError(errors)
  })
})
