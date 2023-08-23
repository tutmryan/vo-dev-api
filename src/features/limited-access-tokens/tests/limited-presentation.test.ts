import casual from 'casual'
import { randomUUID } from 'crypto'
import { graphql } from '../../../generated'
import type { PresentationRequestRegistration } from '../../../generated/graphql'
import { beforeAfterAll, executeOperationAsLimitedAccessClient, expectToBeDefined, expectUnauthorizedError } from '../../../test'

// this test is all about testing the limited access authorization rules (../shield-rules.ts)
// we we're going to mock the resolver, underneath the shield schema middleware

jest.mock('../../presentation/resolvers', () => {
  const originalModule = jest.requireActual('../../presentation/resolvers')
  return {
    resolvers: {
      ...originalModule.resolvers,
      Mutation: {
        ...originalModule.resolvers.Mutation,
        createPresentationRequest: () => ({ requestId: randomUUID(), url: casual.url, qrCode: 'qrCode', expiry: Date.now() + 60 * 5 }),
      },
    },
  }
})

const createPresentationMutation = graphql(`
  mutation CreatePresentationRequest($request: PresentationRequestInput!) {
    createPresentationRequest(request: $request) {
      ... on PresentationResponse {
        requestId
        url
        qrCode
        expiry
      }
      ... on RequestErrorResponse {
        error {
          code
          message
          innererror {
            code
            message
            target
          }
        }
      }
    }
  }
`)

const registration: PresentationRequestRegistration = {
  clientName: 'Test',
  purpose: 'Testing',
}

const credentialType = 'Test'

describe('limited access presentations', () => {
  beforeAfterAll()

  it('can create a presentation request using specified credential types', async () => {
    const { data, errors } = await executeOperationAsLimitedAccessClient(
      {
        query: createPresentationMutation,
        variables: { request: { requestedCredentials: [{ type: credentialType }], registration } },
      },
      { requestableCredentials: [{ credentialType }] },
    )

    expectToBeDefined(data?.createPresentationRequest)
    expect(errors).toBeUndefined()
  })

  it('cannot create a presentation request using unspecified credential types', async () => {
    const { errors } = await executeOperationAsLimitedAccessClient(
      {
        query: createPresentationMutation,
        variables: { request: { requestedCredentials: [{ type: randomUUID() }], registration } },
      },
      { requestableCredentials: [{ credentialType }] },
    )

    expectUnauthorizedError(errors)
  })

  it('can create a presentation request using specified issuers', async () => {
    const identityId = randomUUID()

    const { data, errors } = await executeOperationAsLimitedAccessClient(
      {
        query: createPresentationMutation,
        variables: {
          request: { identityId, requestedCredentials: [{ type: credentialType, acceptedIssuers: ['IssuerA'] }], registration },
        },
      },
      { identityId, requestableCredentials: [{ credentialType, acceptedIssuers: ['IssuerA', 'IssuerB'] }] },
    )

    expectToBeDefined(data?.createPresentationRequest)
    expect(errors).toBeUndefined()
  })

  it('cannot create a presentation request using unspecified issuers', async () => {
    const identityId = randomUUID()

    const { errors } = await executeOperationAsLimitedAccessClient(
      {
        query: createPresentationMutation,
        variables: {
          request: { identityId, requestedCredentials: [{ type: credentialType, acceptedIssuers: ['IssuerC'] }], registration },
        },
      },
      { identityId, requestableCredentials: [{ credentialType, acceptedIssuers: ['IssuerA', 'IssuerB'] }] },
    )

    expectUnauthorizedError(errors)
  })

  it('cannot create a presentation request using specified issuers without identity matching', async () => {
    const identityId = randomUUID()

    const { errors } = await executeOperationAsLimitedAccessClient(
      {
        query: createPresentationMutation,
        variables: {
          request: {
            identityId: randomUUID(),
            requestedCredentials: [{ type: credentialType, acceptedIssuers: ['IssuerA'] }],
            registration,
          },
        },
      },
      { identityId, requestableCredentials: [{ credentialType, acceptedIssuers: ['IssuerA', 'IssuerB'] }] },
    )

    expectUnauthorizedError(errors)
  })

  it('cannot create a presentation request using specified issuers without identity specified', async () => {
    const identityId = randomUUID()

    const { errors } = await executeOperationAsLimitedAccessClient(
      {
        query: createPresentationMutation,
        variables: {
          request: {
            requestedCredentials: [{ type: credentialType, acceptedIssuers: ['IssuerA'] }],
            registration,
          },
        },
      },
      { identityId, requestableCredentials: [{ credentialType, acceptedIssuers: ['IssuerA', 'IssuerB'] }] },
    )

    expectUnauthorizedError(errors)
  })
})
