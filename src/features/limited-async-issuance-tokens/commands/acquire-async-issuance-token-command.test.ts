import { randomUUID } from 'crypto'
import { graphql } from '../../../generated'
import { AsyncIssuanceRequestExpiry, ContactMethod } from '../../../generated/graphql'
import { beforeAfterAll, executeOperationAnonymous, expectResponseUnionToBe } from '../../../test'
import { mockedServices } from '../../../test/mocks'
import { throwError } from '../../../util/throw-error'
import { createAsyncIssuanceRequest } from '../../async-issuance/tests/create-async-issuance'
import { buildContact, givenContract } from '../../async-issuance/tests/index'
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

// redeemVerificationCode calls clearVerificationThrottleForIssuance which requires Redis (not available in tests)
jest.mock('..', () => ({
  ...jest.requireActual('..'),
  redeemVerificationCode: jest.fn().mockResolvedValue(true),
}))

const acquireAsyncIssuanceTokenMutation = graphql(`
  mutation AcquireAsyncIssuanceToken($asyncIssuanceRequestId: UUID!, $verificationCode: String!) {
    acquireAsyncIssuanceToken(asyncIssuanceRequestId: $asyncIssuanceRequestId, verificationCode: $verificationCode) {
      expires
      token
      photoCaptureRequestId
    }
  }
`)

describe('acquireAsyncIssuanceToken mutation', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()
    mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
      mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
    )
    mockedServices.asyncIssuanceService.downloadAsyncIssuance.resolveWithCallArgsResolver(
      mockedServices.asyncIssuanceService.uploadAsyncIssuance.previousAsyncIssuanceCallArgResolver(),
    )
    getClientCredentialsTokenMock.mockReturnValue({ access_token: randomUUID(), expires: 1000 * 60 * 50 })
  })

  it('succeeds without "No user has been attached to this EntityManager" error when called anonymously', async () => {
    // Arrange — create an async issuance with a two-factor verification contact (SMS code path)
    const { contract } = await givenContract({})
    const identity = await createIdentity()
    const contact = buildContact(false, ContactMethod.Email, ContactMethod.Sms)

    const createResponse = await createAsyncIssuanceRequest([
      {
        contractId: contract.id,
        identityId: identity.id,
        expiry: AsyncIssuanceRequestExpiry.OneDay,
        contact,
      },
    ])
    expectResponseUnionToBe(createResponse, 'AsyncIssuanceResponse')
    const requestId = createResponse.asyncIssuanceRequestIds[0] ?? throwError('Request not created')

    // Act — the Concierge calls this as an anonymous (unauthenticated) user: no JWT
    // redeemVerificationCode is mocked to return true (bypasses Redis-only throttle clear)
    const { data, errors } = await executeOperationAnonymous({
      query: acquireAsyncIssuanceTokenMutation,
      variables: { asyncIssuanceRequestId: requestId, verificationCode: '123456' },
    })

    // Assert — should succeed without the entity manager user context error
    expect(errors).toBeUndefined()
    expect(data?.acquireAsyncIssuanceToken.token).toBeDefined()
    expect(data?.acquireAsyncIssuanceToken.expires).toBeDefined()
  })
})
