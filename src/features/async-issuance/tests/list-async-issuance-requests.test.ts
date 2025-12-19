import { createIdentity } from '@/features/identity/tests/create-identity'
import { UserEntity } from '@/features/users/entities/user-entity'
import { mockedServices } from '@/test/mocks'
import { subDays } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import { AsyncIssuanceRequestExpiry, AsyncIssuanceRequestStatus } from '../../../generated/graphql'
import { beforeAfterAll, expectToBeDefinedAndNotNull, expectToBeUndefined, inTransaction } from '../../../test'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'
import { cancelAsyncIssuanceRequest } from './cancel-async-issuance'
import { createAsyncIssuanceRequest } from './create-async-issuance'
import { executeListAsyncIssuanceRequests } from './get-async-issuance'
import { buildContact, givenContract } from './index'

function withMockedServices() {
  mockedServices.adminService.contract.resolvedWith(mockedServices.adminService.contract.buildResolve())
  mockedServices.adminService.authority.resolvedWith(mockedServices.adminService.authority.buildResolve())
  mockedServices.requestService.createIssuanceRequest.resolveWith(mockedServices.requestService.createIssuanceRequest.buildResolve())
  mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
    mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
  )
}

async function createSingleAsyncIssuanceRequest(contractId: string) {
  const identity = await createIdentity()
  const result = await createAsyncIssuanceRequest([
    {
      contractId,
      identityId: identity.id,
      expiry: AsyncIssuanceRequestExpiry.OneMonth,
      contact: buildContact(),
    },
  ])

  if (result.__typename !== 'AsyncIssuanceResponse') {
    throw new Error(`Failed to create async issuance request: ${JSON.stringify(result)}`)
  }

  const asyncIssuanceId = result.asyncIssuanceRequestIds[0]!
  return { asyncIssuanceId, identityId: identity.id }
}

async function createTestUser(): Promise<string> {
  const userId = uuidv4()

  await inTransaction(async (em) => {
    await em.getRepository(UserEntity).save({
      id: userId,
      oid: uuidv4(),
      tenantId: uuidv4(),
      email: 'test@example.com',
      name: 'Test User',
      isApp: false,
    })
  }, userId)

  return userId
}

async function expireAsyncIssuance(asyncIssuanceId: string) {
  const userId = await createTestUser()
  await inTransaction(async (em) => {
    const entity = await em.getRepository(AsyncIssuanceEntity).findOneByOrFail({ id: asyncIssuanceId })
    entity.expiresOn = subDays(new Date(), 1)
    await em.getRepository(AsyncIssuanceEntity).save(entity)
  }, userId)
}

async function setAsyncIssuanceState(asyncIssuanceId: string, state: AsyncIssuanceEntity['state']) {
  const userId = await createTestUser()
  await inTransaction(async (em) => {
    const entity = await em.getRepository(AsyncIssuanceEntity).findOneByOrFail({ id: asyncIssuanceId })
    entity.state = state
    await em.getRepository(AsyncIssuanceEntity).save(entity)
  }, userId)
}

describe('FindAsyncIssuancesQuery', () => {
  beforeAfterAll()

  beforeEach(() => {
    mockedServices.clearAllMocks()
    withMockedServices()
  })

  describe('Expired status excludes terminal states', () => {
    it('does not return issued records even with past expiry', async () => {
      const { contract } = await givenContract({})
      const { asyncIssuanceId } = await createSingleAsyncIssuanceRequest(contract.id)

      await setAsyncIssuanceState(asyncIssuanceId, 'issued')
      await expireAsyncIssuance(asyncIssuanceId)

      const { errors, data } = await executeListAsyncIssuanceRequests({
        where: { status: AsyncIssuanceRequestStatus.Expired, contractId: contract.id },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      expect(data.findAsyncIssuanceRequests).toHaveLength(0)
    })

    it('does not return cancelled records even with past expiry', async () => {
      const { contract } = await givenContract({})
      const { asyncIssuanceId } = await createSingleAsyncIssuanceRequest(contract.id)

      await cancelAsyncIssuanceRequest(asyncIssuanceId)
      await expireAsyncIssuance(asyncIssuanceId)

      const { errors, data } = await executeListAsyncIssuanceRequests({
        where: { status: AsyncIssuanceRequestStatus.Expired, contractId: contract.id },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      expect(data.findAsyncIssuanceRequests).toHaveLength(0)
    })
  })

  describe('Failed status excludes expired records', () => {
    it('does not return failed records with past expiry (they are expired, not failed)', async () => {
      const { contract } = await givenContract({})
      const { asyncIssuanceId } = await createSingleAsyncIssuanceRequest(contract.id)

      await setAsyncIssuanceState(asyncIssuanceId, 'contact-failed')
      await expireAsyncIssuance(asyncIssuanceId)

      const { errors, data } = await executeListAsyncIssuanceRequests({
        where: { status: AsyncIssuanceRequestStatus.Failed, contractId: contract.id },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      expect(data.findAsyncIssuanceRequests).toHaveLength(0)
    })
  })
})
