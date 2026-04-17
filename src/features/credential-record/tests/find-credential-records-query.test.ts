import { randomUUID } from 'crypto'
import { addDays, subDays } from 'date-fns'
import { addUserToManager } from '../../../data/user-context-helper'
import { graphql } from '../../../generated'
import {
  AsyncIssuanceRequestExpiry,
  CommunicationPurpose,
  CommunicationStatus,
  ContactMethod,
  CredentialIssuanceMethod,
  CredentialRecordOrderBy,
  CredentialRecordStatus,
  OrderDirection,
} from '../../../generated/graphql'
import { UserRoles } from '../../../roles'
import { beforeAfterAll, executeOperationAsUser, expectToBeDefinedAndNotNull, expectToBeUndefined, inTransaction } from '../../../test'
import { mockedServices } from '../../../test/mocks'
import { AsyncIssuanceEntity } from '../../async-issuance/entities/async-issuance-entity'
import { createAsyncIssuanceRequest } from '../../async-issuance/tests/create-async-issuance'
import { buildContact, givenContract } from '../../async-issuance/tests/index'
import { CommunicationEntity } from '../../communication/entities/communication-entity'
import { buildContractInput, createContract } from '../../contracts/test/create-contract'
import { createIdentity } from '../../identity/tests/create-identity'
import { IssuanceEntity } from '../../issuance/entities/issuance-entity'
import { UserEntity } from '../../users/entities/user-entity'
import { CredentialRecordEntity } from '../entities/credential-record-entity'

const findCredentialRecordsQuery = graphql(`
  query FindCredentialRecords(
    $where: CredentialRecordWhere
    $offset: NonNegativeInt
    $limit: PositiveInt
    $orderBy: CredentialRecordOrderBy
    $orderDirection: OrderDirection
  ) {
    findCredentialRecords(where: $where, offset: $offset, limit: $limit, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      issuanceMethod
      credentialRecordStatus
      createdAt
      createdBy {
        id
        name
      }
      identity {
        id
      }
      contract {
        id
      }
      issuance {
        id
      }
      asyncIssuanceRequest {
        id
      }
    }
  }
`)

const credentialRecordCountQuery = graphql(`
  query CredentialRecordCount($where: CredentialRecordWhere) {
    credentialRecordCount(where: $where)
  }
`)

async function executeFindCredentialRecords(
  variables: {
    where?: Record<string, unknown>
    limit?: number
    offset?: number
    orderBy?: CredentialRecordOrderBy
    orderDirection?: OrderDirection
  } = {},
) {
  return executeOperationAsUser({ query: findCredentialRecordsQuery, variables }, UserRoles.issuer)
}

async function executeCredentialRecordCount(variables: { where?: Record<string, unknown> } = {}) {
  return executeOperationAsUser({ query: credentialRecordCountQuery, variables }, UserRoles.issuer)
}

async function createTestUser(): Promise<string> {
  const userId = randomUUID()
  await inTransaction(async (em) => {
    await em.getRepository(UserEntity).save({
      id: userId,
      oid: randomUUID(),
      tenantId: randomUUID(),
      email: `${userId}@example.com`,
      name: 'Test User',
      isApp: false,
    })
  }, userId)
  return userId
}

async function seedIssuance({
  contractId,
  identityId,
  expiresAt = addDays(new Date(), 365),
  isRevoked = false,
}: {
  contractId: string
  identityId: string
  expiresAt?: Date
  isRevoked?: boolean
}): Promise<IssuanceEntity & { credentialRecordId: string }> {
  const issuedById = await createTestUser()
  return inTransaction(async (em) => {
    addUserToManager(em, issuedById)
    const credentialRecord = new CredentialRecordEntity()
    credentialRecord.createdById = issuedById
    credentialRecord.contractId = contractId
    credentialRecord.identityId = identityId
    credentialRecord.expiresAt = null
    await em.getRepository(CredentialRecordEntity).save(credentialRecord)
    const entity = new IssuanceEntity({
      id: randomUUID(),
      requestId: randomUUID(),
      contractId,
      identityId,
      issuedById,
      expiresAt,
      hasFaceCheckPhoto: null,
      credentialRecordId: credentialRecord.id,
    })
    if (isRevoked) {
      const revoker = await em.getRepository(UserEntity).findOneByOrFail({ id: issuedById })
      entity.markAsRevoked(revoker)
    }
    return em.getRepository(IssuanceEntity).save(entity)
  }, issuedById)
}

async function seedAsyncIssuance({ contractId, identityId }: { contractId: string; identityId: string }): Promise<string> {
  const result = await createAsyncIssuanceRequest([
    {
      contractId,
      identityId,
      expiry: AsyncIssuanceRequestExpiry.OneMonth,
      contact: buildContact(),
    },
  ])
  if (result.__typename !== 'AsyncIssuanceResponse') {
    throw new Error(`Failed to create async issuance: ${JSON.stringify(result)}`)
  }
  return result.asyncIssuanceRequestIds[0]!
}

async function expireAsyncIssuance(id: string) {
  const userId = await createTestUser()
  await inTransaction(async (em) => {
    const entity = await em.getRepository(AsyncIssuanceEntity).findOneByOrFail({ id })
    entity.expiresOn = subDays(new Date(), 1)
    await em.getRepository(AsyncIssuanceEntity).save(entity)
  }, userId)
}

async function setAsyncIssuanceState(id: string, state: AsyncIssuanceEntity['state']) {
  const userId = await createTestUser()
  await inTransaction(async (em) => {
    const entity = await em.getRepository(AsyncIssuanceEntity).findOneByOrFail({ id })
    entity.state = state
    await em.getRepository(AsyncIssuanceEntity).save(entity)
  }, userId)
}

async function seedInPersonCredentialRecord({
  contractId,
  identityId,
  failedAt = null,
  cancelledAt = null,
  expiresAt = null,
}: {
  contractId: string
  identityId: string
  failedAt?: Date | null
  cancelledAt?: Date | null
  expiresAt?: Date | null
}): Promise<string> {
  const issuedById = await createTestUser()
  let credentialRecordId: string
  await inTransaction(async (em) => {
    addUserToManager(em, issuedById)
    const credentialRecord = new CredentialRecordEntity()
    credentialRecord.createdById = issuedById
    credentialRecord.contractId = contractId
    credentialRecord.identityId = identityId
    credentialRecord.expiresAt = expiresAt
    credentialRecord.failedAt = failedAt
    credentialRecord.cancelledAt = cancelledAt
    await em.getRepository(CredentialRecordEntity).save(credentialRecord)
    credentialRecordId = credentialRecord.id
  }, issuedById)
  return credentialRecordId!
}

async function seedVerificationCommunication({ asyncIssuanceId, identityId }: { asyncIssuanceId: string; identityId: string }) {
  const userId = await createTestUser()
  await inTransaction(async (em) => {
    const communication = new CommunicationEntity({
      createdById: userId,
      recipientId: identityId,
      contactMethod: ContactMethod.Sms,
      purpose: CommunicationPurpose.Verification,
      status: CommunicationStatus.Sent,
      asyncIssuanceId,
    })
    await em.getRepository(CommunicationEntity).save(communication)
    // Update the denormalized flag to match what communications-service does
    await em.getRepository(AsyncIssuanceEntity).update(asyncIssuanceId, { hasVerificationCommunication: true })
  }, userId)
}

async function linkIssuanceToAsyncIssuance(asyncIssuanceId: string, issuanceId: string) {
  const userId = await createTestUser()
  await inTransaction(async (em) => {
    const entity = await em.getRepository(AsyncIssuanceEntity).findOneByOrFail({ id: asyncIssuanceId })
    entity.state = 'issued'
    entity.issuanceId = issuanceId
    await em.getRepository(AsyncIssuanceEntity).save(entity)
  }, userId)
}

function withMockedServices() {
  mockedServices.adminService.contract.resolvedWith(mockedServices.adminService.contract.buildResolve())
  mockedServices.adminService.authority.resolvedWith(mockedServices.adminService.authority.buildResolve())
  mockedServices.requestService.createIssuanceRequest.resolveWith(mockedServices.requestService.createIssuanceRequest.buildResolve())
  mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
    mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
  )
}

describe('FindCredentialRecordsQuery', () => {
  beforeAfterAll()

  beforeEach(() => {
    mockedServices.clearAllMocks()
    withMockedServices()
  })

  describe('issuanceMethod filtering', () => {
    it('returns in-person issuances with issuanceMethod = inPerson', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const issuance = await seedIssuance({ contractId: contract.id, identityId: identity.id })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, issuanceMethod: CredentialIssuanceMethod.InPerson },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      expect(data.findCredentialRecords).toHaveLength(1)
      expect(data.findCredentialRecords[0]!.id).toBe(issuance.credentialRecordId)
      expect(data.findCredentialRecords[0]!.issuanceMethod).toBe(CredentialIssuanceMethod.InPerson)
      expect(data.findCredentialRecords[0]!.issuance?.id).toBe(issuance.id)
      expect(data.findCredentialRecords[0]!.asyncIssuanceRequest).toBeNull()
    })

    it('returns remotely-issued credentials with issuanceMethod = remote', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const issuance = await seedIssuance({ contractId: contract.id, identityId: identity.id })
      const asyncIssuanceId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
      await linkIssuanceToAsyncIssuance(asyncIssuanceId, issuance.id)

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, issuanceMethod: CredentialIssuanceMethod.Remote },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const records = data.findCredentialRecords.filter((r) => r.issuance?.id === issuance.id)
      expect(records).toHaveLength(1)
      expect(records[0]!.issuanceMethod).toBe(CredentialIssuanceMethod.Remote)
    })

    it('inPerson filter excludes remote-origin records', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      // Seed one direct issuance and one async offer
      await seedIssuance({ contractId: contract.id, identityId: identity.id })
      await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, issuanceMethod: CredentialIssuanceMethod.InPerson },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      expect(data.findCredentialRecords.every((r) => r.issuanceMethod === CredentialIssuanceMethod.InPerson)).toBe(true)
    })
  })

  describe('credentialRecordStatus filtering', () => {
    it('returns active issuances with credentialRecordStatus = issued', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const issuance = await seedIssuance({ contractId: contract.id, identityId: identity.id, expiresAt: addDays(new Date(), 365) })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.IssuanceCompleted },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const match = data.findCredentialRecords.find((r) => r.id === issuance.credentialRecordId)
      expectToBeDefinedAndNotNull(match)
      expect(match.credentialRecordStatus).toBe(CredentialRecordStatus.IssuanceCompleted)
    })

    it('returns revoked credentials with credentialRecordStatus = revoked', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const issuance = await seedIssuance({ contractId: contract.id, identityId: identity.id, isRevoked: true })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.Revoked },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const match = data.findCredentialRecords.find((r) => r.id === issuance.credentialRecordId)
      expectToBeDefinedAndNotNull(match)
      expect(match.credentialRecordStatus).toBe(CredentialRecordStatus.Revoked)
    })

    it('returns expired credentials with credentialRecordStatus = credentialExpired', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const issuance = await seedIssuance({ contractId: contract.id, identityId: identity.id, expiresAt: subDays(new Date(), 1) })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.Expired },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const match = data.findCredentialRecords.find((r) => r.id === issuance.credentialRecordId)
      expectToBeDefinedAndNotNull(match)
      expect(match.credentialRecordStatus).toBe(CredentialRecordStatus.Expired)
    })

    it('returns offered async requests with credentialRecordStatus = offered', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const asyncIssuanceId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.Offered },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const match = data.findCredentialRecords.find((r) => r.asyncIssuanceRequest?.id === asyncIssuanceId)
      expectToBeDefinedAndNotNull(match)
      expect(match.credentialRecordStatus).toBe(CredentialRecordStatus.Offered)
      expect(match.issuance).toBeNull()
    })

    it('returns expired offers with credentialRecordStatus = offerExpired', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const asyncIssuanceId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
      await expireAsyncIssuance(asyncIssuanceId)

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.OfferExpired },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const match = data.findCredentialRecords.find((r) => r.asyncIssuanceRequest?.id === asyncIssuanceId)
      expectToBeDefinedAndNotNull(match)
      expect(match.credentialRecordStatus).toBe(CredentialRecordStatus.OfferExpired)
    })

    it('returns offerFailed async requests with credentialRecordStatus = offerFailed (contact-failed)', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const asyncIssuanceId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
      await setAsyncIssuanceState(asyncIssuanceId, 'contact-failed')

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.OfferFailed },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const match = data.findCredentialRecords.find((r) => r.asyncIssuanceRequest?.id === asyncIssuanceId)
      expectToBeDefinedAndNotNull(match)
      expect(match.credentialRecordStatus).toBe(CredentialRecordStatus.OfferFailed)
    })

    it('returns issuanceFailed async requests with credentialRecordStatus = issuanceFailed (issuance-failed)', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const asyncIssuanceId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
      await setAsyncIssuanceState(asyncIssuanceId, 'issuance-failed')

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.IssuanceFailed },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const match = data.findCredentialRecords.find((r) => r.asyncIssuanceRequest?.id === asyncIssuanceId)
      expectToBeDefinedAndNotNull(match)
      expect(match.credentialRecordStatus).toBe(CredentialRecordStatus.IssuanceFailed)
    })

    it('returns cancelled async requests with credentialRecordStatus = offerCancelled', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const asyncIssuanceId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
      await setAsyncIssuanceState(asyncIssuanceId, 'cancelled')

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.OfferCancelled },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const match = data.findCredentialRecords.find((r) => r.asyncIssuanceRequest?.id === asyncIssuanceId)
      expectToBeDefinedAndNotNull(match)
      expect(match.credentialRecordStatus).toBe(CredentialRecordStatus.OfferCancelled)
    })

    it('returns unredeemed in-person offers with credentialRecordStatus = offerPending', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const issuedById = await createTestUser()
      let credentialRecordId: string
      await inTransaction(async (em) => {
        addUserToManager(em, issuedById)
        const credentialRecord = new CredentialRecordEntity()
        credentialRecord.createdById = issuedById
        credentialRecord.contractId = contract.id
        credentialRecord.identityId = identity.id
        credentialRecord.expiresAt = null
        await em.getRepository(CredentialRecordEntity).save(credentialRecord)
        credentialRecordId = credentialRecord.id
      }, issuedById)

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.IssuanceStarted },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const match = data.findCredentialRecords.find((r) => r.id === credentialRecordId!)
      expectToBeDefinedAndNotNull(match)
      expect(match.credentialRecordStatus).toBe(CredentialRecordStatus.IssuanceStarted)
      expect(match.issuance).toBeNull()
      expect(match.asyncIssuanceRequest).toBeNull()
    })

    it('returns in-person failed credential records with credentialRecordStatus = issuanceFailed', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const credentialRecordId = await seedInPersonCredentialRecord({
        contractId: contract.id,
        identityId: identity.id,
        failedAt: new Date(),
      })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.IssuanceFailed },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const match = data.findCredentialRecords.find((r) => r.id === credentialRecordId)
      expectToBeDefinedAndNotNull(match)
      expect(match.credentialRecordStatus).toBe(CredentialRecordStatus.IssuanceFailed)
      expect(match.issuanceMethod).toBe(CredentialIssuanceMethod.InPerson)
      expect(match.issuance).toBeNull()
      expect(match.asyncIssuanceRequest).toBeNull()
    })

    it('issuanceStarted filter excludes in-person issuanceFailed records', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const pendingId = await seedInPersonCredentialRecord({ contractId: contract.id, identityId: identity.id })
      const failedId = await seedInPersonCredentialRecord({
        contractId: contract.id,
        identityId: identity.id,
        failedAt: new Date(),
      })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.IssuanceStarted },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      expect(data.findCredentialRecords.find((r) => r.id === pendingId)).toBeDefined()
      expect(data.findCredentialRecords.find((r) => r.id === failedId)).toBeUndefined()
    })

    it('issuanceFailed filter excludes in-person issuanceStarted records', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const pendingId = await seedInPersonCredentialRecord({ contractId: contract.id, identityId: identity.id })
      const failedId = await seedInPersonCredentialRecord({
        contractId: contract.id,
        identityId: identity.id,
        failedAt: new Date(),
      })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.IssuanceFailed },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const inPersonResults = data.findCredentialRecords.filter((r) => r.issuanceMethod === CredentialIssuanceMethod.InPerson)
      expect(inPersonResults.find((r) => r.id === failedId)).toBeDefined()
      expect(inPersonResults.find((r) => r.id === pendingId)).toBeUndefined()
    })

    it('returns cancelled in-person offers with credentialRecordStatus = offerCancelled', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const credentialRecordId = await seedInPersonCredentialRecord({
        contractId: contract.id,
        identityId: identity.id,
        cancelledAt: new Date(),
      })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.OfferCancelled },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const match = data.findCredentialRecords.find((r) => r.id === credentialRecordId)
      expectToBeDefinedAndNotNull(match)
      expect(match.credentialRecordStatus).toBe(CredentialRecordStatus.OfferCancelled)
      expect(match.issuanceMethod).toBe(CredentialIssuanceMethod.InPerson)
      expect(match.issuance).toBeNull()
      expect(match.asyncIssuanceRequest).toBeNull()
    })

    it('offerPending filter excludes cancelled in-person records', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const pendingId = await seedInPersonCredentialRecord({ contractId: contract.id, identityId: identity.id })
      const cancelledId = await seedInPersonCredentialRecord({
        contractId: contract.id,
        identityId: identity.id,
        cancelledAt: new Date(),
      })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.IssuanceStarted },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      expect(data.findCredentialRecords.find((r) => r.id === pendingId)).toBeDefined()
      expect(data.findCredentialRecords.find((r) => r.id === cancelledId)).toBeUndefined()
    })

    it('offerPending filter excludes expired in-person records', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const pendingId = await seedInPersonCredentialRecord({
        contractId: contract.id,
        identityId: identity.id,
        expiresAt: addDays(new Date(), 1),
      })
      const expiredId = await seedInPersonCredentialRecord({
        contractId: contract.id,
        identityId: identity.id,
        expiresAt: subDays(new Date(), 1),
      })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.IssuanceStarted },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      expect(data.findCredentialRecords.find((r) => r.id === pendingId)).toBeDefined()
      expect(data.findCredentialRecords.find((r) => r.id === expiredId)).toBeUndefined()
    })

    it('returns expired in-person sessions with credentialRecordStatus = issuanceExpired', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const credentialRecordId = await seedInPersonCredentialRecord({
        contractId: contract.id,
        identityId: identity.id,
        expiresAt: subDays(new Date(), 1),
      })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.IssuanceExpired },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const match = data.findCredentialRecords.find((r) => r.id === credentialRecordId)
      expectToBeDefinedAndNotNull(match)
      expect(match.credentialRecordStatus).toBe(CredentialRecordStatus.IssuanceExpired)
      expect(match.issuanceMethod).toBe(CredentialIssuanceMethod.InPerson)
      expect(match.issuance).toBeNull()
      expect(match.asyncIssuanceRequest).toBeNull()
    })

    it('issuanceExpired filter excludes in-person issuanceStarted records', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const pendingId = await seedInPersonCredentialRecord({
        contractId: contract.id,
        identityId: identity.id,
        expiresAt: addDays(new Date(), 1),
      })
      const expiredId = await seedInPersonCredentialRecord({
        contractId: contract.id,
        identityId: identity.id,
        expiresAt: subDays(new Date(), 1),
      })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.IssuanceExpired },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const inPersonResults = data.findCredentialRecords.filter((r) => r.issuanceMethod === CredentialIssuanceMethod.InPerson)
      expect(inPersonResults.find((r) => r.id === expiredId)).toBeDefined()
      expect(inPersonResults.find((r) => r.id === pendingId)).toBeUndefined()
    })

    it('issuanceFailed filter excludes cancelled in-person records', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const failedId = await seedInPersonCredentialRecord({
        contractId: contract.id,
        identityId: identity.id,
        failedAt: new Date(),
      })
      const cancelledId = await seedInPersonCredentialRecord({
        contractId: contract.id,
        identityId: identity.id,
        cancelledAt: new Date(),
      })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.IssuanceFailed },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const inPersonResults = data.findCredentialRecords.filter((r) => r.issuanceMethod === CredentialIssuanceMethod.InPerson)
      expect(inPersonResults.find((r) => r.id === failedId)).toBeDefined()
      expect(inPersonResults.find((r) => r.id === cancelledId)).toBeUndefined()
    })

    it('no status filter returns records with all statuses', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()

      await seedIssuance({ contractId: contract.id, identityId: identity.id, expiresAt: addDays(new Date(), 365) })
      await seedIssuance({ contractId: contract.id, identityId: identity.id, isRevoked: true })
      await seedIssuance({ contractId: contract.id, identityId: identity.id, expiresAt: subDays(new Date(), 1) })
      const offeredId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
      const offerExpiredId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
      const failedId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
      const cancelledId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })

      await expireAsyncIssuance(offerExpiredId)
      await setAsyncIssuanceState(failedId, 'contact-failed')
      await setAsyncIssuanceState(cancelledId, 'cancelled')

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id },
        limit: 50,
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)

      const statuses = data.findCredentialRecords.map((r) => r.credentialRecordStatus)
      expect(statuses).toContain(CredentialRecordStatus.IssuanceCompleted)
      expect(statuses).toContain(CredentialRecordStatus.Revoked)
      expect(statuses).toContain(CredentialRecordStatus.Expired)
      expect(statuses).toContain(CredentialRecordStatus.Offered)
      expect(statuses).toContain(CredentialRecordStatus.OfferExpired)
      expect(statuses).toContain(CredentialRecordStatus.OfferFailed)
      expect(statuses).toContain(CredentialRecordStatus.OfferCancelled)
      expect(data.findCredentialRecords.find((r) => r.asyncIssuanceRequest?.id === offeredId)).toBeDefined()
    })

    describe('verificationStarted', () => {
      it('returns verificationStarted for a remote async issuance that has a verification communication', async () => {
        const { contract } = await givenContract({})
        const identity = await createIdentity()
        const asyncIssuanceId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
        await seedVerificationCommunication({ asyncIssuanceId, identityId: identity.id })

        const { errors, data } = await executeFindCredentialRecords({
          where: { contractId: contract.id },
        })

        expectToBeUndefined(errors)
        expectToBeDefinedAndNotNull(data)
        const match = data.findCredentialRecords.find((r) => r.asyncIssuanceRequest?.id === asyncIssuanceId)
        expectToBeDefinedAndNotNull(match)
        expect(match.credentialRecordStatus).toBe(CredentialRecordStatus.VerificationStarted)
      })

      it('filtering by verificationStarted returns only records with verification communications', async () => {
        const { contract } = await givenContract({})
        const identity = await createIdentity()
        const asyncIssuanceWithVerification = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
        const asyncIssuanceWithoutVerification = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
        await seedVerificationCommunication({ asyncIssuanceId: asyncIssuanceWithVerification, identityId: identity.id })

        const { errors, data } = await executeFindCredentialRecords({
          where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.VerificationStarted },
        })

        expectToBeUndefined(errors)
        expectToBeDefinedAndNotNull(data)
        expect(data.findCredentialRecords.find((r) => r.asyncIssuanceRequest?.id === asyncIssuanceWithVerification)).toBeDefined()
        expect(data.findCredentialRecords.find((r) => r.asyncIssuanceRequest?.id === asyncIssuanceWithoutVerification)).toBeUndefined()
      })

      it('shows identityNotVerified (not issuanceFailed) when async issuance has verification-failed state even with verification communication', async () => {
        const { contract } = await givenContract({})
        const identity = await createIdentity()
        const asyncIssuanceId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
        await seedVerificationCommunication({ asyncIssuanceId, identityId: identity.id })
        await setAsyncIssuanceState(asyncIssuanceId, 'issuance-verification-failed')

        const { errors, data } = await executeFindCredentialRecords({
          where: { contractId: contract.id },
        })

        expectToBeUndefined(errors)
        expectToBeDefinedAndNotNull(data)
        const match = data.findCredentialRecords.find((r) => r.asyncIssuanceRequest?.id === asyncIssuanceId)
        expectToBeDefinedAndNotNull(match)
        expect(match.credentialRecordStatus).toBe(CredentialRecordStatus.IdentityNotVerified)
      })

      it('does not return verificationStarted for an expired async issuance with verification communication', async () => {
        const { contract } = await givenContract({})
        const identity = await createIdentity()
        const asyncIssuanceId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
        await seedVerificationCommunication({ asyncIssuanceId, identityId: identity.id })
        await expireAsyncIssuance(asyncIssuanceId)

        const { errors, data } = await executeFindCredentialRecords({
          where: { contractId: contract.id },
        })

        expectToBeUndefined(errors)
        expectToBeDefinedAndNotNull(data)
        const match = data.findCredentialRecords.find((r) => r.asyncIssuanceRequest?.id === asyncIssuanceId)
        expectToBeDefinedAndNotNull(match)
        expect(match.credentialRecordStatus).toBe(CredentialRecordStatus.OfferExpired)
      })
    })

    describe('identityNotVerified', () => {
      it('returns identityNotVerified for a remote async issuance in issuance-verification-failed state', async () => {
        const { contract } = await givenContract({})
        const identity = await createIdentity()
        const asyncIssuanceId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
        await setAsyncIssuanceState(asyncIssuanceId, 'issuance-verification-failed')

        const { errors, data } = await executeFindCredentialRecords({
          where: { contractId: contract.id },
        })

        expectToBeUndefined(errors)
        expectToBeDefinedAndNotNull(data)
        const match = data.findCredentialRecords.find((r) => r.asyncIssuanceRequest?.id === asyncIssuanceId)
        expectToBeDefinedAndNotNull(match)
        expect(match.credentialRecordStatus).toBe(CredentialRecordStatus.IdentityNotVerified)
      })

      it('filtering by identityNotVerified returns only records in issuance-verification-failed state', async () => {
        const { contract } = await givenContract({})
        const identity = await createIdentity()
        const failedId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
        const offeredId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
        await setAsyncIssuanceState(failedId, 'issuance-verification-failed')

        const { errors, data } = await executeFindCredentialRecords({
          where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.IdentityNotVerified },
        })

        expectToBeUndefined(errors)
        expectToBeDefinedAndNotNull(data)
        expect(data.findCredentialRecords.find((r) => r.asyncIssuanceRequest?.id === failedId)).toBeDefined()
        expect(data.findCredentialRecords.find((r) => r.asyncIssuanceRequest?.id === offeredId)).toBeUndefined()
      })

      it('contact-failed returns offerFailed and issuance-failed returns issuanceFailed (not identityNotVerified)', async () => {
        const { contract } = await givenContract({})
        const identity = await createIdentity()
        const contactFailedId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
        const issuanceFailedId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
        await setAsyncIssuanceState(contactFailedId, 'contact-failed')
        await setAsyncIssuanceState(issuanceFailedId, 'issuance-failed')

        const { errors, data } = await executeFindCredentialRecords({
          where: { contractId: contract.id },
        })

        expectToBeUndefined(errors)
        expectToBeDefinedAndNotNull(data)
        const contactMatch = data.findCredentialRecords.find((r) => r.asyncIssuanceRequest?.id === contactFailedId)
        const issuanceMatch = data.findCredentialRecords.find((r) => r.asyncIssuanceRequest?.id === issuanceFailedId)
        expectToBeDefinedAndNotNull(contactMatch)
        expectToBeDefinedAndNotNull(issuanceMatch)
        expect(contactMatch.credentialRecordStatus).toBe(CredentialRecordStatus.OfferFailed)
        expect(issuanceMatch.credentialRecordStatus).toBe(CredentialRecordStatus.IssuanceFailed)
      })

      it('does not return identityNotVerified for an expired async issuance in issuance-verification-failed state', async () => {
        const { contract } = await givenContract({})
        const identity = await createIdentity()
        const asyncIssuanceId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
        await setAsyncIssuanceState(asyncIssuanceId, 'issuance-verification-failed')
        await expireAsyncIssuance(asyncIssuanceId)

        const { errors, data } = await executeFindCredentialRecords({
          where: { contractId: contract.id },
        })

        expectToBeUndefined(errors)
        expectToBeDefinedAndNotNull(data)
        const match = data.findCredentialRecords.find((r) => r.asyncIssuanceRequest?.id === asyncIssuanceId)
        expectToBeDefinedAndNotNull(match)
        expect(match.credentialRecordStatus).toBe(CredentialRecordStatus.OfferExpired)
      })
    })
  })

  describe('createdBy', () => {
    it('resolves createdBy for in-person issuance records', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const issuance = await seedIssuance({ contractId: contract.id, identityId: identity.id })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.IssuanceCompleted },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const match = data.findCredentialRecords.find((r) => r.id === issuance.credentialRecordId)
      expectToBeDefinedAndNotNull(match)
      expectToBeDefinedAndNotNull(match.createdBy)
      expect(match.createdBy.id).toBeTruthy()
      expect(match.createdBy.name).toBeTruthy()
    })

    it('resolves createdBy for in-person issuanceStarted records', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()
      const issuedById = await createTestUser()
      let credentialRecordId: string
      await inTransaction(async (em) => {
        addUserToManager(em, issuedById)
        const credentialRecord = new CredentialRecordEntity()
        credentialRecord.createdById = issuedById
        credentialRecord.contractId = contract.id
        credentialRecord.identityId = identity.id
        credentialRecord.expiresAt = null
        await em.getRepository(CredentialRecordEntity).save(credentialRecord)
        credentialRecordId = credentialRecord.id
      }, issuedById)

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.IssuanceStarted },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const match = data.findCredentialRecords.find((r) => r.id === credentialRecordId!)
      expectToBeDefinedAndNotNull(match)
      expectToBeDefinedAndNotNull(match.createdBy)
      expect(match.createdBy.id).toBe(issuedById)
    })
  })

  describe('where filters', () => {
    it('contractId filter scopes results to the given contract', async () => {
      const { contract: contract1 } = await givenContract({})
      const { contract: contract2 } = await givenContract({})
      const identity = await createIdentity()

      await seedIssuance({ contractId: contract1.id, identityId: identity.id })
      await seedIssuance({ contractId: contract2.id, identityId: identity.id })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract1.id },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      expect(data.findCredentialRecords.every((r) => r.contract.id === contract1.id)).toBe(true)
    })

    it('identityId filter scopes results to the given identity', async () => {
      const { contract } = await givenContract({})
      const identity1 = await createIdentity()
      const identity2 = await createIdentity()

      await seedIssuance({ contractId: contract.id, identityId: identity1.id })
      await seedIssuance({ contractId: contract.id, identityId: identity2.id })

      const { errors, data } = await executeFindCredentialRecords({
        where: { identityId: identity1.id },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      expect(data.findCredentialRecords.every((r) => r.identity.id === identity1.id)).toBe(true)
    })
  })

  describe('sorting', () => {
    it('sorts by contractName ascending', async () => {
      const contractA = await createContract(buildContractInput({ name: 'AAA Sort Test Contract' }))
      const contractZ = await createContract(buildContractInput({ name: 'ZZZ Sort Test Contract' }))
      const identity = await createIdentity()

      await seedIssuance({ contractId: contractA.id, identityId: identity.id })
      await seedIssuance({ contractId: contractZ.id, identityId: identity.id })

      const { errors, data } = await executeFindCredentialRecords({
        where: { identityId: identity.id },
        orderBy: CredentialRecordOrderBy.ContractName,
        orderDirection: OrderDirection.Asc,
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const ids = data.findCredentialRecords.map((r) => r.contract.id)
      expect(ids.indexOf(contractA.id)).toBeLessThan(ids.indexOf(contractZ.id))
    })

    it('sorts by contractName descending', async () => {
      const contractA = await createContract(buildContractInput({ name: 'AAA Sort Test Contract' }))
      const contractZ = await createContract(buildContractInput({ name: 'ZZZ Sort Test Contract' }))
      const identity = await createIdentity()

      await seedIssuance({ contractId: contractA.id, identityId: identity.id })
      await seedIssuance({ contractId: contractZ.id, identityId: identity.id })

      const { errors, data } = await executeFindCredentialRecords({
        where: { identityId: identity.id },
        orderBy: CredentialRecordOrderBy.ContractName,
        orderDirection: OrderDirection.Desc,
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const ids = data.findCredentialRecords.map((r) => r.contract.id)
      expect(ids.indexOf(contractZ.id)).toBeLessThan(ids.indexOf(contractA.id))
    })

    it('sorts by identityName ascending', async () => {
      const { contract } = await givenContract({})
      const identity1 = await createIdentity({ issuer: 'issuer', identifier: randomUUID(), name: 'AAA Sort Test Identity' })
      const identity2 = await createIdentity({ issuer: 'issuer', identifier: randomUUID(), name: 'ZZZ Sort Test Identity' })

      await seedIssuance({ contractId: contract.id, identityId: identity1.id })
      await seedIssuance({ contractId: contract.id, identityId: identity2.id })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id },
        orderBy: CredentialRecordOrderBy.IdentityName,
        orderDirection: OrderDirection.Asc,
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const identityIds = data.findCredentialRecords.map((r) => r.identity.id)
      expect(identityIds.indexOf(identity1.id)).toBeLessThan(identityIds.indexOf(identity2.id))
    })

    it('sorts by createdAt ascending', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()

      await seedIssuance({ contractId: contract.id, identityId: identity.id })
      await seedIssuance({ contractId: contract.id, identityId: identity.id })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, identityId: identity.id },
        orderBy: CredentialRecordOrderBy.CreatedAt,
        orderDirection: OrderDirection.Asc,
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      // Verify each record's createdAt is >= the previous (non-decreasing order)
      const returnedDates = data.findCredentialRecords.map((r) => new Date(r.createdAt).getTime())
      for (let i = 1; i < returnedDates.length; i++) {
        expect(returnedDates[i]).toBeGreaterThanOrEqual(returnedDates[i - 1]!)
      }
    })

    it('sorts by createdAt descending', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()

      await seedIssuance({ contractId: contract.id, identityId: identity.id })
      await seedIssuance({ contractId: contract.id, identityId: identity.id })

      const { errors, data } = await executeFindCredentialRecords({
        where: { contractId: contract.id, identityId: identity.id },
        orderBy: CredentialRecordOrderBy.CreatedAt,
        orderDirection: OrderDirection.Desc,
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      // Verify each record's createdAt is <= the previous (non-increasing order)
      const returnedDates = data.findCredentialRecords.map((r) => new Date(r.createdAt).getTime())
      for (let i = 1; i < returnedDates.length; i++) {
        expect(returnedDates[i]).toBeLessThanOrEqual(returnedDates[i - 1]!)
      }
    })
  })

  describe('pagination', () => {
    it('respects limit and offset', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()

      await seedIssuance({ contractId: contract.id, identityId: identity.id })
      await seedIssuance({ contractId: contract.id, identityId: identity.id })
      await seedIssuance({ contractId: contract.id, identityId: identity.id })

      const { errors: errorsPage1, data: dataPage1 } = await executeFindCredentialRecords({
        where: { contractId: contract.id, identityId: identity.id },
        limit: 2,
        offset: 0,
      })
      const { errors: errorsPage2, data: dataPage2 } = await executeFindCredentialRecords({
        where: { contractId: contract.id, identityId: identity.id },
        limit: 2,
        offset: 2,
      })

      expectToBeUndefined(errorsPage1)
      expectToBeUndefined(errorsPage2)
      expectToBeDefinedAndNotNull(dataPage1)
      expectToBeDefinedAndNotNull(dataPage2)
      expect(dataPage1.findCredentialRecords).toHaveLength(2)
      expect(dataPage2.findCredentialRecords).toHaveLength(1)

      const idsPage1 = dataPage1.findCredentialRecords.map((r) => r.id)
      const idsPage2 = dataPage2.findCredentialRecords.map((r) => r.id)
      expect(idsPage1.some((id) => idsPage2.includes(id))).toBe(false)
    })
  })

  describe('id filter', () => {
    it('returns the matching issuance record when filtering by credential record id', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()

      const issuance1 = await seedIssuance({ contractId: contract.id, identityId: identity.id })
      await seedIssuance({ contractId: contract.id, identityId: identity.id })

      const { errors, data } = await executeFindCredentialRecords({
        where: { id: issuance1.credentialRecordId },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      expect(data.findCredentialRecords).toHaveLength(1)
      expect(data.findCredentialRecords[0]!.id).toBe(issuance1.credentialRecordId)
    })

    it('returns the matching async issuance record when filtering by credential record id', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()

      const asyncIssuanceId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })
      await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })

      const { errors: lookupErrors, data: lookupData } = await executeFindCredentialRecords({
        where: { contractId: contract.id, identityId: identity.id },
        limit: 100,
      })
      expectToBeUndefined(lookupErrors)
      expectToBeDefinedAndNotNull(lookupData)
      const targetRecord = lookupData.findCredentialRecords.find((r) => r.asyncIssuanceRequest?.id === asyncIssuanceId)
      expectToBeDefinedAndNotNull(targetRecord)

      const { errors, data } = await executeFindCredentialRecords({
        where: { id: targetRecord.id },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      expect(data.findCredentialRecords).toHaveLength(1)
      expect(data.findCredentialRecords[0]!.id).toBe(targetRecord.id)
      expect(data.findCredentialRecords[0]!.asyncIssuanceRequest?.id).toBe(asyncIssuanceId)
    })
  })

  describe('credentialRecordCount', () => {
    it('returns the total count matching where criteria', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()

      await seedIssuance({ contractId: contract.id, identityId: identity.id })
      await seedIssuance({ contractId: contract.id, identityId: identity.id })
      await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })

      const { errors, data } = await executeCredentialRecordCount({
        where: { contractId: contract.id, identityId: identity.id },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      expect(data.credentialRecordCount).toBe(3)
    })
  })

  describe('AND/OR filter operators', () => {
    it('OR: returns records matching either of two statuses', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()

      const issuance = await seedIssuance({ contractId: contract.id, identityId: identity.id })
      const asyncId = await seedAsyncIssuance({ contractId: contract.id, identityId: identity.id })

      const { errors, data } = await executeFindCredentialRecords({
        where: {
          contractId: contract.id,
          identityId: identity.id,
          OR: [
            { credentialRecordStatus: CredentialRecordStatus.IssuanceCompleted },
            { credentialRecordStatus: CredentialRecordStatus.Offered },
          ],
        },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const ids = data.findCredentialRecords.map((r) => r.id)
      expect(ids).toContain(issuance.credentialRecordId)
      const asyncRecord = data.findCredentialRecords.find((r) => r.asyncIssuanceRequest?.id === asyncId)
      expect(asyncRecord).toBeDefined()
    })

    it('OR: does not return records that match neither status', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()

      const revokedIssuance = await seedIssuance({ contractId: contract.id, identityId: identity.id, isRevoked: true })

      const { errors, data } = await executeFindCredentialRecords({
        where: {
          contractId: contract.id,
          identityId: identity.id,
          OR: [
            { credentialRecordStatus: CredentialRecordStatus.IssuanceCompleted },
            { credentialRecordStatus: CredentialRecordStatus.Offered },
          ],
        },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      expect(data.findCredentialRecords.map((r) => r.id)).not.toContain(revokedIssuance.credentialRecordId)
    })

    it('AND: returns only records matching all conditions', async () => {
      const { contract } = await givenContract({})
      const identity1 = await createIdentity()
      const identity2 = await createIdentity()

      const issuance1 = await seedIssuance({ contractId: contract.id, identityId: identity1.id })
      await seedIssuance({ contractId: contract.id, identityId: identity2.id })

      const { errors, data } = await executeFindCredentialRecords({
        where: {
          AND: [
            { contractId: contract.id },
            { identityId: identity1.id },
            { credentialRecordStatus: CredentialRecordStatus.IssuanceCompleted },
          ],
        },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      expect(data.findCredentialRecords).toHaveLength(1)
      expect(data.findCredentialRecords[0]!.id).toBe(issuance1.credentialRecordId)
    })

    it('OR with no overlap: returns deduplicated results when same record matches multiple branches', async () => {
      const { contract } = await givenContract({})
      const identity = await createIdentity()

      const issuance = await seedIssuance({ contractId: contract.id, identityId: identity.id })

      const { errors, data } = await executeFindCredentialRecords({
        where: {
          OR: [
            { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.IssuanceCompleted },
            { contractId: contract.id, credentialRecordStatus: CredentialRecordStatus.IssuanceCompleted },
          ],
        },
      })

      expectToBeUndefined(errors)
      expectToBeDefinedAndNotNull(data)
      const matchingIds = data.findCredentialRecords.filter((r) => r.id === issuance.credentialRecordId)
      expect(matchingIds).toHaveLength(1)
    })

    it('rejects filters that exceed maximum depth', async () => {
      const { errors } = await executeFindCredentialRecords({
        where: {
          AND: [{ OR: [{ AND: [{ OR: [{ contractId: 'x' }] }] }] }],
        },
      })

      expect(errors).toBeDefined()
      expect(errors![0]!.message).toMatch(/depth limit/)
    })

    it('rejects filters that exceed maximum condition count', async () => {
      const { errors } = await executeFindCredentialRecords({
        where: {
          AND: Array.from({ length: 21 }, (_, i) => ({ contractId: `contract-${i}` })),
        },
      })

      expect(errors).toBeDefined()
      expect(errors![0]!.message).toMatch(/exceeds the maximum/)
    })
  })
})
