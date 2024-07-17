import { randomUUID } from 'crypto'
import { graphql } from '../../../generated'
import type { AccessTokenResponse, AcquireLimitedAccessTokenInput } from '../../../generated/graphql'
import { beforeAfterAll, buildJwt, executeOperationAs, expectUnauthorizedError } from '../../../test'
import { createIdentityInput, saveIdentityMutation } from '../../identity/create-update-identity.test'
import { LimitedAccessTokenAcquisitionRoles } from '../shield-rules'

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

export const acquireLimitedAccessTokenMutation = graphql(`
  mutation AcquireLimitedAccessToken($input: AcquireLimitedAccessTokenInput!) {
    acquireLimitedAccessToken(input: $input) {
      expires
      token
    }
  }
`)

export function expectAccessToken(accessTokenResponse?: AccessTokenResponse): asserts accessTokenResponse {
  expect(accessTokenResponse).toMatchObject({ expires: expect.any(Date), token: expect.any(String) })
}

const validIssuanceInput = () => <AcquireLimitedAccessTokenInput>{ identityId: randomUUID(), issuableContractIds: [randomUUID()] }

describe('limited access token acquisition for issuance', () => {
  beforeAfterAll()

  it('can save and read identity info', async () => {
    const { data, errors } = await executeOperationAs(
      { query: saveIdentityMutation, variables: { input: createIdentityInput() } },
      buildJwt({ roles: [LimitedAccessTokenAcquisitionRoles.issuance] }),
    )
    expect(errors).toBeUndefined()
    expect(data?.saveIdentity?.id).toBeDefined()
  })

  it('cannot save and read identity info with anonymous acquisition role', async () => {
    const { errors } = await executeOperationAs(
      { query: saveIdentityMutation, variables: { input: createIdentityInput() } },
      buildJwt({ roles: [LimitedAccessTokenAcquisitionRoles.anonymousPresentations] }),
    )
    expectUnauthorizedError(errors)
  })

  it('can acquire an issuance token', async () => {
    const { data, errors } = await executeOperationAs(
      { query: acquireLimitedAccessTokenMutation, variables: { input: validIssuanceInput() } },
      buildJwt({ roles: [LimitedAccessTokenAcquisitionRoles.issuance] }),
    )
    expect(errors).toBeUndefined()
    expectAccessToken(data?.acquireLimitedAccessToken)
  })

  it('cannot acquire an issuance token without identity', async () => {
    const { errors } = await executeOperationAs(
      { query: acquireLimitedAccessTokenMutation, variables: { input: { ...validIssuanceInput(), identityId: undefined } } },
      buildJwt({ roles: [LimitedAccessTokenAcquisitionRoles.issuance] }),
    )
    expectUnauthorizedError(errors)
  })

  it('cannot acquire an issuance token for anonymous presentations', async () => {
    const { errors } = await executeOperationAs(
      { query: acquireLimitedAccessTokenMutation, variables: { input: { ...validIssuanceInput(), allowAnonymousPresentation: true } } },
      buildJwt({
        roles: [LimitedAccessTokenAcquisitionRoles.issuance, LimitedAccessTokenAcquisitionRoles.anonymousPresentations],
      }),
    )
    expectUnauthorizedError(errors)
  })

  it('cannot acquire an issuance token without the required role', async () => {
    const { errors } = await executeOperationAs(
      { query: acquireLimitedAccessTokenMutation, variables: { input: validIssuanceInput() } },
      buildJwt({
        roles: [LimitedAccessTokenAcquisitionRoles.presentation, LimitedAccessTokenAcquisitionRoles.listContracts],
      }),
    )
    expectUnauthorizedError(errors)
  })
})

const validPresentationInput = () =>
  <AcquireLimitedAccessTokenInput>{
    identityId: randomUUID(),
    requestableCredentials: [{ credentialType: randomUUID(), acceptedIssuers: [randomUUID()] }],
  }

describe('limited access token acquisition for presentations', () => {
  beforeAfterAll()

  it('can acquire a presentation token', async () => {
    const { data, errors } = await executeOperationAs(
      { query: acquireLimitedAccessTokenMutation, variables: { input: validPresentationInput() } },
      buildJwt({ roles: [LimitedAccessTokenAcquisitionRoles.presentation] }),
    )
    expect(errors).toBeUndefined()
    expectAccessToken(data?.acquireLimitedAccessToken)
  })

  it('cannot acquire a presentation token without identity', async () => {
    const { errors } = await executeOperationAs(
      { query: acquireLimitedAccessTokenMutation, variables: { input: { ...validPresentationInput(), identityId: undefined } } },
      buildJwt({ roles: [LimitedAccessTokenAcquisitionRoles.presentation] }),
    )
    expectUnauthorizedError(errors)
  })

  it('cannot acquire a presentation token without the required role', async () => {
    const { errors } = await executeOperationAs(
      { query: acquireLimitedAccessTokenMutation, variables: { input: validPresentationInput() } },
      buildJwt({
        roles: [LimitedAccessTokenAcquisitionRoles.issuance, LimitedAccessTokenAcquisitionRoles.listContracts],
      }),
    )
    expectUnauthorizedError(errors)
  })
})

const validListContractsInput = () =>
  <AcquireLimitedAccessTokenInput>{
    listContracts: true,
  }

describe('limited access token acquisition for list contracts', () => {
  beforeAfterAll()

  it('can acquire a list contracts token', async () => {
    const { data, errors } = await executeOperationAs(
      { query: acquireLimitedAccessTokenMutation, variables: { input: validListContractsInput() } },
      buildJwt({ roles: [LimitedAccessTokenAcquisitionRoles.listContracts] }),
    )
    expect(errors).toBeUndefined()
    expectAccessToken(data?.acquireLimitedAccessToken)
  })

  it('cannot acquire a list contracts token without the required role', async () => {
    const { errors } = await executeOperationAs(
      { query: acquireLimitedAccessTokenMutation, variables: { input: validListContractsInput() } },
      buildJwt({
        roles: [LimitedAccessTokenAcquisitionRoles.issuance, LimitedAccessTokenAcquisitionRoles.presentation],
      }),
    )
    expectUnauthorizedError(errors)
  })
})

const validAnonymousPresentationsInput = () =>
  <AcquireLimitedAccessTokenInput>{
    allowAnonymousPresentation: true,
    requestableCredentials: [{ credentialType: randomUUID() }],
  }

describe('limited access token acquisition for anonymous presentations', () => {
  beforeAfterAll()

  it('can acquire an anonymous presentations token', async () => {
    const { data, errors } = await executeOperationAs(
      { query: acquireLimitedAccessTokenMutation, variables: { input: validAnonymousPresentationsInput() } },
      buildJwt({ roles: [LimitedAccessTokenAcquisitionRoles.anonymousPresentations] }),
    )
    expect(errors).toBeUndefined()
    expectAccessToken(data?.acquireLimitedAccessToken)
  })

  it('cannot acquire an anonymous presentations token with identity input', async () => {
    const { errors } = await executeOperationAs(
      {
        query: acquireLimitedAccessTokenMutation,
        variables: { input: { ...validAnonymousPresentationsInput(), identityId: randomUUID() } },
      },
      buildJwt({ roles: [LimitedAccessTokenAcquisitionRoles.anonymousPresentations] }),
    )
    expectUnauthorizedError(errors)
  })

  it('cannot acquire an anonymous presentations token without the required role', async () => {
    const { errors } = await executeOperationAs(
      { query: acquireLimitedAccessTokenMutation, variables: { input: validAnonymousPresentationsInput() } },
      buildJwt({
        roles: [
          LimitedAccessTokenAcquisitionRoles.issuance,
          LimitedAccessTokenAcquisitionRoles.presentation,
          LimitedAccessTokenAcquisitionRoles.listContracts,
        ],
      }),
    )
    expectUnauthorizedError(errors)
  })

  it('can acquire an anonymous presentations token with issuers specified', async () => {
    const { data, errors } = await executeOperationAs(
      {
        query: acquireLimitedAccessTokenMutation,
        variables: {
          input: {
            ...validAnonymousPresentationsInput(),
            requestableCredentials: [{ credentialType: randomUUID(), acceptedIssuers: [randomUUID()] }],
          },
        },
      },
      buildJwt({ roles: [LimitedAccessTokenAcquisitionRoles.anonymousPresentations] }),
    )
    expect(errors).toBeUndefined()
    expectAccessToken(data?.acquireLimitedAccessToken)
  })

  it('cannot acquire an anonymous presentations token with issuableContractIds input', async () => {
    const { errors } = await executeOperationAs(
      {
        query: acquireLimitedAccessTokenMutation,
        variables: {
          input: {
            ...validAnonymousPresentationsInput(),
            issuableContractIds: [randomUUID()],
          },
        },
      },
      buildJwt({ roles: [LimitedAccessTokenAcquisitionRoles.anonymousPresentations] }),
    )
    expectUnauthorizedError(errors)
  })
})
