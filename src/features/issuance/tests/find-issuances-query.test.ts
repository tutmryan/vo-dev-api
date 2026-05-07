import { randomUUID } from 'crypto'
import { addDays } from 'date-fns'
import { addUserToManager } from '../../../data/user-context-helper'
import { graphql } from '../../../generated'
import { UserRoles } from '../../../roles'
import { beforeAfterAll, executeOperationAsUser, expectToBeDefinedAndNotNull, expectToBeUndefined, inTransaction } from '../../../test'
import { mockedServices } from '../../../test/mocks'
import { givenContract } from '../../async-issuance/tests/index'
import { CredentialRecordEntity } from '../../credential-record/entities/credential-record-entity'
import { createIdentity } from '../../identity/tests/create-identity'
import { UserEntity } from '../../users/entities/user-entity'
import { IssuanceEntity } from '../entities/issuance-entity'

const findIssuancesQuery = graphql(`
  query FindIssuancesForTest($where: IssuanceWhere) {
    findIssuances(where: $where) {
      id
      credentialRecordId
    }
  }
`)

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

async function seedIssuance({ contractId, identityId }: { contractId: string; identityId: string }) {
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
      expiresAt: addDays(new Date(), 365),
      hasFaceCheckPhoto: null,
      credentialRecordId: credentialRecord.id,
    })
    return em.getRepository(IssuanceEntity).save(entity)
  }, issuedById)
}

function withMockedServices() {
  mockedServices.adminService.contract.resolvedWith(mockedServices.adminService.contract.buildResolve())
  mockedServices.adminService.authority.resolvedWith(mockedServices.adminService.authority.buildResolve())
  mockedServices.requestService.createIssuanceRequest.resolveWith(mockedServices.requestService.createIssuanceRequest.buildResolve())
  mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
    mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
  )
}

describe('FindIssuancesQuery', () => {
  beforeAfterAll()

  beforeEach(() => {
    mockedServices.clearAllMocks()
    withMockedServices()
  })

  it('returns credentialRecordId on each issuance', async () => {
    const { contract } = await givenContract({})
    const identity = await createIdentity()
    const issuance = await seedIssuance({ contractId: contract.id, identityId: identity.id })

    const { errors, data } = await executeOperationAsUser(
      { query: findIssuancesQuery, variables: { where: { contractId: contract.id } } },
      UserRoles.issuer,
    )

    expectToBeUndefined(errors)
    expectToBeDefinedAndNotNull(data)
    const match = data.findIssuances.find((i) => i.id === issuance.id)
    expectToBeDefinedAndNotNull(match)
    expect(match.credentialRecordId).toBe(issuance.credentialRecordId)
  })
})
