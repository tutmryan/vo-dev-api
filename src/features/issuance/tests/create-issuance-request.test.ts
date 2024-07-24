import { randomUUID } from 'crypto'
import type { ContractInput } from '../../../generated/graphql'
import { beforeAfterAll, executeOperationAsLimitedAccessClient } from '../../../test'
import { mockAdminServiceHelper, mockRequestServiceHelper } from '../../../test/mock-services'
import { buildContractInput, createContract } from '../../contracts/test/create-contract'
import { provisionContract } from '../../contracts/test/provision-contract'
import { createIdentity } from '../../identity/tests/create-identity'
import { createIssuanceRequestMutation } from './create-issuance'

const credentialType = 'issuance-test'
const externalContractId = randomUUID()

describe('createIssuanceRequest mutation', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockAdminServiceHelper.clearAllMocks()
    mockRequestServiceHelper.clearAllMocks()
  })

  async function givenContract({ faceCheckSupport }: { faceCheckSupport?: ContractInput['faceCheckSupport'] }) {
    const contract = await createContract(
      buildContractInput({
        templateId: null,
        faceCheckSupport,
        credentialTypes: [credentialType],
      }),
    )

    return { contract }
  }

  it('works with valid input ', async () => {
    // Arrange
    const { contract } = await givenContract({})
    const identity = await createIdentity()
    await provisionContract(contract.id, externalContractId)
    mockAdminServiceHelper.contract.resolvedWith(mockAdminServiceHelper.contract.buildResolve())
    mockAdminServiceHelper.authority.resolvedWith(mockAdminServiceHelper.authority.buildResolve())
    mockRequestServiceHelper.createIssuanceRequest.resolveWith(mockRequestServiceHelper.createIssuanceRequest.buildResolve())

    // Act
    const { errors, data } = await executeOperationAsLimitedAccessClient(
      {
        query: createIssuanceRequestMutation,
        variables: {
          request: {
            contractId: contract.id,
          },
        },
      },
      { identityId: identity.id, issuableContractIds: [contract.id] },
    )

    // Assert
    expect(errors).toBeUndefined()
    expect(data).toBeDefined()
  })
  it('works with face check and passing the photo ', async () => {})
  it('works with face check and using a photo request id', async () => {})
})
