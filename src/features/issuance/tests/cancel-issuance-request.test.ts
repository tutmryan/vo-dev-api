import { randomUUID } from 'crypto'
import { AsyncIssuanceRequestExpiry } from '../../../generated/graphql'
import { UserRoles } from '../../../roles'
import { beforeAfterAll, executeOperationAsUser, expectResponseUnionToBe, inTransaction } from '../../../test'
import { mockedServices } from '../../../test/mocks'
import { throwError } from '../../../util/throw-error'
import { AsyncIssuanceEntity } from '../../async-issuance/entities/async-issuance-entity'
import { createAsyncIssuanceRequest } from '../../async-issuance/tests/create-async-issuance'
import { buildContact, givenContract as givenAsyncContract } from '../../async-issuance/tests/index'
import { buildContractInput, createContract } from '../../contracts/test/create-contract'
import { provisionContract } from '../../contracts/test/provision-contract'
import { CredentialRecordEntity } from '../../credential-record/entities/credential-record-entity'
import { createIdentity } from '../../identity/tests/create-identity'
import { createIssuanceRequest } from './create-issuance'

async function givenContract() {
  const contract = await createContract(buildContractInput({ templateId: null }))
  await provisionContract(contract.id, randomUUID())
  return { contract }
}

function withMockedServices() {
  mockedServices.adminService.contract.resolvedWith(mockedServices.adminService.contract.buildResolve())
  mockedServices.adminService.authority.resolvedWith(mockedServices.adminService.authority.buildResolve())
  mockedServices.requestService.createIssuanceRequest.resolveWith(mockedServices.requestService.createIssuanceRequest.buildResolve())
  mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
    mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
  )
}

const cancelIssuanceRequestMutation = `
  mutation CancelIssuanceRequest($credentialRecordId: ID!) {
    cancelIssuanceRequest(credentialRecordId: $credentialRecordId)
  }
`

describe('cancelIssuanceRequest mutation', () => {
  beforeAfterAll()

  beforeEach(() => {
    mockedServices.clearAllMocks()
  })

  it('sets cancelledAt on the credential record', async () => {
    // Arrange
    withMockedServices()
    const { contract } = await givenContract()
    const identity = await createIdentity()
    const result = await createIssuanceRequest({ contractId: contract.id }, { identityId: identity.id, issuableContractIds: [contract.id] })
    if (!result || !('credentialRecordId' in result)) throw new Error('Expected IssuanceResponse')
    const { credentialRecordId } = result

    // Act
    const { errors, data } = await executeOperationAsUser<{ cancelIssuanceRequest: boolean }>(
      { query: cancelIssuanceRequestMutation, variables: { credentialRecordId } },
      UserRoles.issuer,
    )

    // Assert
    expect(errors).toBeUndefined()
    expect(data?.cancelIssuanceRequest).toBe(true)
    const credentialRecord = await inTransaction((em) =>
      em.getRepository(CredentialRecordEntity).findOneByOrFail({ id: credentialRecordId }),
    )
    expect(credentialRecord.cancelledAt).toBeInstanceOf(Date)
  })

  it('is idempotent — does not error when already cancelled', async () => {
    // Arrange
    withMockedServices()
    const { contract } = await givenContract()
    const identity = await createIdentity()
    const result = await createIssuanceRequest({ contractId: contract.id }, { identityId: identity.id, issuableContractIds: [contract.id] })
    if (!result || !('credentialRecordId' in result)) throw new Error('Expected IssuanceResponse')
    const { credentialRecordId } = result
    await executeOperationAsUser<{ cancelIssuanceRequest: boolean }>(
      { query: cancelIssuanceRequestMutation, variables: { credentialRecordId } },
      UserRoles.issuer,
    )

    // Act — cancel again
    const { errors, data } = await executeOperationAsUser<{ cancelIssuanceRequest: boolean }>(
      { query: cancelIssuanceRequestMutation, variables: { credentialRecordId } },
      UserRoles.issuer,
    )

    // Assert
    expect(errors).toBeUndefined()
    expect(data?.cancelIssuanceRequest).toBe(true)
  })

  it('errors when the credential record belongs to an async issuance request', async () => {
    // Arrange
    mockedServices.clearAllMocks()
    mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
      mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
    )
    const { contract } = await givenAsyncContract({})
    const identity = await createIdentity()
    const createResponse = await createAsyncIssuanceRequest([
      { contractId: contract.id, identityId: identity.id, contact: buildContact(), expiry: AsyncIssuanceRequestExpiry.OneDay },
    ])
    expectResponseUnionToBe(createResponse, 'AsyncIssuanceResponse')
    const requestId = createResponse.asyncIssuanceRequestIds[0] ?? throwError('Request not created')
    const asyncIssuance = await inTransaction((em) => em.getRepository(AsyncIssuanceEntity).findOneOrFail({ where: { id: requestId } }))

    // Act
    const { errors } = await executeOperationAsUser<{ cancelIssuanceRequest: boolean }>(
      { query: cancelIssuanceRequestMutation, variables: { credentialRecordId: asyncIssuance.credentialRecordId } },
      UserRoles.issuer,
    )

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toContain('async issuance')
  })
})
