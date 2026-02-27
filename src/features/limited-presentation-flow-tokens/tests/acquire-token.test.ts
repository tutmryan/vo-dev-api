import { randomUUID } from 'crypto'
import { startOfToday } from 'date-fns'
import { getLimitedPresentationFlowTokenData } from '..'
import { graphql } from '../../../generated'
import type { PresentationFlowInput, PresentationFlowTokenResponse } from '../../../generated/graphql'
import { AppRoles } from '../../../roles'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsApp } from '../../../test'
import { createIdentity } from '../../identity/tests/create-identity'

const getClientCredentialsTokenMock = jest.fn(() => ({ access_token: randomUUID(), expires: 1000 * 60 * 50 }))
jest.mock('@makerx/node-common', () => {
  const originalModule = jest.requireActual('@makerx/node-common')
  return {
    ...originalModule,
    get getClientCredentialsToken() {
      return getClientCredentialsTokenMock
    },
  }
})

export const acquireLimitedPresentationFlowTokenMutation = graphql(`
  mutation AcquireLimitedPresentationFlowToken($input: AcquireLimitedPresentationFlowTokenInput!) {
    acquireLimitedPresentationFlowToken(input: $input) {
      token
      expires
    }
  }
`)

export const createPresentationFlowMutation = graphql(`
  mutation CreatePresentationFlow($request: PresentationFlowInput!) {
    createPresentationFlow(request: $request) {
      request {
        id
      }
    }
  }
`)

async function createPresentationFlow(input: PresentationFlowInput) {
  const { data, errors } = await executeOperationAsApp(
    {
      query: createPresentationFlowMutation,
      variables: { request: input },
    },
    AppRoles.presentationFlowCreate,
  )

  if (errors) throw new Error(`Error while creating presentation flow]: ${JSON.stringify(errors)}`)
  return data!.createPresentationFlow
}

async function getDefaultPresentationFlowInput(): Promise<PresentationFlowInput> {
  const identity = await createIdentity()
  return {
    identityId: identity.id,
    expiresAt: undefined,
    prePresentationText: 'Please present your credential',
    requestData: { test: true },
    presentationRequest: {
      registration: {
        clientName: 'VO Presentation Flow',
        purpose: 'Verify a credential',
      },
      requestedCredentials: [
        {
          type: 'verifiedContractor',
          acceptedIssuers: ['did:example:123'],
        },
      ],
    },
  }
}

export function expectPresentationFlowToken(tokenResponse?: PresentationFlowTokenResponse): asserts tokenResponse {
  expect(tokenResponse).toMatchObject({ expires: expect.any(Date), token: expect.any(String) })
}

describe('limited presentation flow token acquisition', () => {
  beforeAfterAll()

  it('fails when presentation flow does not exist', async () => {
    const { errors } = await executeOperationAnonymous({
      query: acquireLimitedPresentationFlowTokenMutation,
      variables: { input: { presentationFlowId: randomUUID() } },
    })
    expect(errors).toBeDefined()
  })

  it('fails when presentation flow is no longer pending', async () => {
    // Arrange
    const requestInput = await getDefaultPresentationFlowInput()
    await createPresentationFlow({ ...requestInput, expiresAt: startOfToday() })

    // Act
    const { errors } = await executeOperationAnonymous({
      query: acquireLimitedPresentationFlowTokenMutation,
      variables: { input: { presentationFlowId: randomUUID() } },
    })

    // Assert
    expect(errors).toBeDefined()
  })

  it('returns a token when presentation flow is pending', async () => {
    // Arrange
    const requestInput = await getDefaultPresentationFlowInput()
    const request = await createPresentationFlow(requestInput)

    // Act
    const { data, errors } = await executeOperationAnonymous({
      query: acquireLimitedPresentationFlowTokenMutation,
      variables: { input: { presentationFlowId: request.request.id } },
    })

    // Assert
    expect(errors).toBeUndefined()
    expect(data?.acquireLimitedPresentationFlowToken.token).toBeTruthy()
    expectPresentationFlowToken(data?.acquireLimitedPresentationFlowToken)

    const tokenData = await getLimitedPresentationFlowTokenData(data!.acquireLimitedPresentationFlowToken.token)
    expect(tokenData.userId).toBeTruthy()
  })
})
