import { randomUUID } from 'crypto'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsCredentialAdmin, expectUnauthorizedError } from '../../test'
import { mockedServices } from '../../test/mocks'
import { buildContractInput, createContract } from './test/create-contract'
import { deprecateContractMutation } from './test/deprecate-contract'
import { provisionContractMutation } from './test/provision-contract'

describe('deprecateContract mutation', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()
    mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
      mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
    )
  })
  async function givenContract() {
    const contract = await createContract(buildContractInput({}))

    return { contract }
  }

  it('returns an unauthorized error when accessed anonymously', async () => {
    // Arrange
    const { contract } = await givenContract()

    // Act
    const { errors } = await executeOperationAnonymous({
      query: deprecateContractMutation,
      variables: {
        id: contract.id,
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('marks the contract as deprecated if the contract has been provisioned', async () => {
    // Arrange
    const { contract } = await givenContract()
    const externalContractId = randomUUID()

    mockedServices.adminService.createContract.resolveWith(
      mockedServices.adminService.createContract.buildResolve({ id: externalContractId }),
    )
    await executeOperationAsCredentialAdmin({
      query: provisionContractMutation,
      variables: {
        id: contract.id,
      },
    })

    // Act
    const { errors, data } = await executeOperationAsCredentialAdmin({
      query: deprecateContractMutation,
      variables: {
        id: contract.id,
      },
    })

    // Assert
    expect(errors).toBeUndefined()
    expect(data).not.toBeNull()
    expect(data?.deprecateContract.isDeprecated).toBe(true)
    expect(data?.deprecateContract.deprecatedAt).not.toBeNull()
  })

  it('throws error if contract has not been provisioned', async () => {
    // Arrange
    const { contract } = await givenContract()

    // Act
    const { errors } = await executeOperationAsCredentialAdmin({
      query: deprecateContractMutation,
      variables: {
        id: contract.id,
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toMatchInlineSnapshot(`"Contract has not been provisioned yet, it can be deleted instead"`)
  })
})
