import { entityManager } from '../../../data'
import { AsyncIssuanceRequestExpiry } from '../../../generated/graphql'
import { UserRoles } from '../../../roles'
import { beforeAfterAll, executeOperationAsUser, expectResponseUnionToBe, expectToBeDefinedAndNotNull, inTransaction } from '../../../test'
import { executeJob } from '../../../test/background-job'
import { mockedServices } from '../../../test/mocks'
import { throwError } from '../../../util/throw-error'
import { assertExhaustive } from '../../../util/type-helpers'
import { createIdentity } from '../../identity/tests/create-identity'
import { cannotCancelError } from '../commands/cancel-async-issuance-request-command'
import { AsyncIssuanceEntity, ValidCancellationStates } from '../entities/async-issuance-entity'
import { cancelAsyncIssuanceRequestsHandler } from '../jobs/cancel-async-issuance-requests'
import { cancelAsyncIssuanceRequest, cancelAsyncIssuanceRequestMutation } from './cancel-async-issuance'
import { createAsyncIssuanceRequest } from './create-async-issuance'
import { buildContact, givenContract } from './index'

async function runCancellationTest(
  cancelAtState: ValidCancellationStates,
  doAct: (requestId: string, entity: AsyncIssuanceEntity) => Promise<void>,
) {
  // Arrange
  const { contract } = await givenContract({})
  const identity = await createIdentity()
  const contact = buildContact()
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

  const fetchEntity = async () => await entityManager.getRepository(AsyncIssuanceEntity).findOneOrFail({ where: { id: requestId } })
  let entity = await fetchEntity()

  switch (cancelAtState) {
    case 'pending':
      // no-op
      break
    case 'contacted':
      entity.contacted()
      await inTransaction(async (entityManager) => entityManager.getRepository(AsyncIssuanceEntity).save(entity), entity.createdById)
      break
    case 'contact-failed':
    case 'issuance-verification-failed':
    case 'issuance-failed':
      entity.failed(cancelAtState)
      break
    case 'verification-complete':
      entity.state = 'verification-complete'
      await inTransaction(async (entityManager) => entityManager.getRepository(AsyncIssuanceEntity).save(entity), entity.createdById)
      break
    case 'cancelled':
      entity.canceled()
      await inTransaction(async (entityManager) => entityManager.getRepository(AsyncIssuanceEntity).save(entity), entity.createdById)
      break
    default:
      assertExhaustive(cancelAtState)
  }

  // Act
  await doAct(requestId, entity)

  // Assert
  entity = await fetchEntity()
  expect(entity.state).toEqual('cancelled')
}

describe('cancelAsyncIssuanceRequestsHandler background job', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()
    mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
      mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
    )
  })
  describe('with valid input', () => {
    it.each<{
      type: string
      cancelAtState: ValidCancellationStates
    }>([
      { type: 'issuance with status of pending works', cancelAtState: 'pending' },
      { type: 'issuance with status of contacted works', cancelAtState: 'contacted' },
      { type: 'issuance with status of contact-failed works', cancelAtState: 'contact-failed' },
      { type: 'issuance with status of issuance-verification-failed works', cancelAtState: 'issuance-verification-failed' },
      { type: 'issuance with status of issuance-failed works', cancelAtState: 'issuance-failed' },
      { type: 'issuance with status of verification-complete works', cancelAtState: 'verification-complete' },
      { type: 'issuance with status of cancelled works', cancelAtState: 'cancelled' },
    ])('$type', async ({ cancelAtState }) => {
      await runCancellationTest(cancelAtState, async (requestId, asyncIssuance) => {
        await executeJob(cancelAsyncIssuanceRequestsHandler, {
          userId: asyncIssuance.createdById,
          asyncIssuanceRequestIds: [requestId],
        })
      })
    })
  })
})

describe('cancelAsyncIssuanceRequest mutation', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()
    mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
      mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
    )
  })
  describe('with valid input', () => {
    it.each<{
      type: string
      cancelAtState: ValidCancellationStates
    }>([
      { type: 'issuance with status of pending works', cancelAtState: 'pending' },
      { type: 'issuance with status of contacted works', cancelAtState: 'contacted' },
      { type: 'issuance with status of contact-failed works', cancelAtState: 'contact-failed' },
      { type: 'issuance with status of issuance-verification-failed works', cancelAtState: 'issuance-verification-failed' },
      { type: 'issuance with status of issuance-failed works', cancelAtState: 'issuance-failed' },
      { type: 'issuance with status of verification-complete works', cancelAtState: 'verification-complete' },
      { type: 'issuance with status of cancelled works', cancelAtState: 'cancelled' },
    ])('$type', async ({ cancelAtState }) => {
      await runCancellationTest(cancelAtState, async (requestId) => {
        await cancelAsyncIssuanceRequest(requestId)
      })
    })
  })
  describe('with invalid input', () => {
    it('issuance with status of issued fails', async () => {
      // Arrange
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const contact = buildContact()
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

      const entity = await entityManager.getRepository(AsyncIssuanceEntity).findOneOrFail({ where: { id: requestId } })
      // Small hack to skip the IssuanceEntity dependency requirement of entity.issued()
      entity.state = 'issued'
      await inTransaction(async (entityManager) => entityManager.getRepository(AsyncIssuanceEntity).save(entity), entity.createdById)

      // Act
      const { data, errors } = await executeOperationAsUser(
        {
          query: cancelAsyncIssuanceRequestMutation,
          variables: { asyncIssuanceRequestId: requestId },
        },
        UserRoles.issuer,
      )

      // Assert
      expect(data?.cancelAsyncIssuanceRequest).toBeNull()
      expectToBeDefinedAndNotNull(errors)
      expect(errors[0]?.message).toEqual(cannotCancelError)
    })
  })
})
