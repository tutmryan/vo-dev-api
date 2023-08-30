import casual from 'casual'
import { randomUUID } from 'crypto'
import { graphql } from '../../../generated'
import { beforeAfterAll, executeOperationAsLimitedAccessClient, expectToBeDefined, expectUnauthorizedError } from '../../../test'

// this test is all about testing the limited access authorization rules (../shield-rules.ts)
// we we're going to mock the resolver, underneath the shield schema middleware

jest.mock('../../issuance/resolvers', () => {
  const originalModule = jest.requireActual('../../issuance/resolvers')
  return {
    resolvers: {
      ...originalModule.resolvers,
      Mutation: {
        ...originalModule.resolvers.Mutation,
        createIssuanceRequest: () => ({ requestId: randomUUID(), url: casual.url, qrCode: casual.word }),
      },
    },
  }
})

const createIssuanceMutation = graphql(`
  mutation CreateIssuanceRequest($request: IssuanceRequestInput!) {
    createIssuanceRequest(request: $request) {
      ... on IssuanceResponse {
        requestId
        url
        qrCode
      }
      ... on RequestErrorResponse {
        error {
          code
          message
        }
      }
    }
  }
`)

describe('limited access issuance', () => {
  beforeAfterAll()

  it('can create an issuance request using specified contractIds', async () => {
    const contractId = randomUUID()
    const identityId = randomUUID()

    const { data, errors } = await executeOperationAsLimitedAccessClient(
      {
        query: createIssuanceMutation,
        variables: { request: { contractId, identityId } },
      },
      { identityId, issuableContractIds: [contractId] },
    )

    expectToBeDefined(data?.createIssuanceRequest)
    expect(errors).toBeUndefined()
  })

  it('cannot create an issuance request with a mismatching contractId', async () => {
    const contractId = randomUUID()
    const identityId = randomUUID()

    const { errors } = await executeOperationAsLimitedAccessClient(
      {
        query: createIssuanceMutation,
        variables: { request: { contractId: randomUUID(), identityId } },
      },
      { identityId, issuableContractIds: [contractId] },
    )

    expectUnauthorizedError(errors)
  })

  it('cannot create an issuance request with a mismatching identityId', async () => {
    const contractId = randomUUID()
    const identityId = randomUUID()

    const { errors } = await executeOperationAsLimitedAccessClient(
      {
        query: createIssuanceMutation,
        variables: { request: { contractId, identityId: randomUUID() } },
      },
      { identityId, issuableContractIds: [contractId] },
    )

    expectUnauthorizedError(errors)
  })
})
