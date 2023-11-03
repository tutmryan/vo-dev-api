import { randomUUID } from 'crypto'
import { mock as AdminService, mockCreateContract, mockUpdateContract } from '../../services/__mocks__/admin'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsCredentialAdmin, expectUnauthorizedError } from '../../test'
import { buildContractInput, createContract } from './test/create-contract'
import { deprecateContractMutation } from './test/deprecate-contract'
import { provisionContractMutation } from './test/provision-contract'

jest.mock('../../services/admin')

describe('provisionContract mutation', () => {
  beforeAfterAll()
  beforeEach(() => AdminService.clearAllMocks())

  async function givenContract() {
    const contract = await createContract(buildContractInput({}))

    return { contract }
  }

  it('returns an errors when in an anonymous context', async () => {
    // Arrange
    const { contract } = await givenContract()

    // Act
    const { errors } = await executeOperationAnonymous({
      query: provisionContractMutation,
      variables: {
        id: contract.id,
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('updates the contract with external id when provisioning for first time', async () => {
    // Arrange
    const { contract } = await givenContract()
    const externalContractId = randomUUID()
    mockCreateContract.mockResolvedValue({ id: externalContractId })

    // Act
    const { errors, data } = await executeOperationAsCredentialAdmin({
      query: provisionContractMutation,
      variables: {
        id: contract.id,
      },
    })

    // Assert
    expect(mockCreateContract).toHaveBeenCalled()
    expect(errors).toBeUndefined()
    expect(data).not.toBeNull()
    expect(data?.provisionContract.externalId).toBe(externalContractId)
    expect(data?.provisionContract.provisionedAt).not.toBeNull()
  })

  it('updates the last provisioned at when republishing', async () => {
    // Arrange
    const { contract } = await givenContract()
    const externalContractId = randomUUID()
    mockCreateContract.mockResolvedValue({ id: externalContractId })
    //publishing for the first time
    await executeOperationAsCredentialAdmin({
      query: provisionContractMutation,
      variables: {
        id: contract.id,
      },
    })

    // Act
    // re-publishing the contract
    const { errors, data } = await executeOperationAsCredentialAdmin({
      query: provisionContractMutation,
      variables: {
        id: contract.id,
      },
    })

    // Assert
    expect(mockCreateContract).toHaveBeenCalled()
    expect(mockUpdateContract).toHaveBeenCalled()
    expect(errors).toBeUndefined()
    expect(data).not.toBeNull()
    expect(data?.provisionContract.lastProvisionedAt).not.toBeNull()
  })

  it('throws error when republishing deprecated contract', async () => {
    // Arrange
    const { contract } = await givenContract()
    const externalContractId = randomUUID()
    mockCreateContract.mockResolvedValue({ id: externalContractId })
    //publishing for the first time
    await executeOperationAsCredentialAdmin({
      query: provisionContractMutation,
      variables: {
        id: contract.id,
      },
    })
    //deprecate the contract
    await executeOperationAsCredentialAdmin({
      query: deprecateContractMutation,
      variables: {
        id: contract.id,
      },
    })

    // Act
    // re-publishing the contract
    const { errors } = await executeOperationAsCredentialAdmin({
      query: provisionContractMutation,
      variables: {
        id: contract.id,
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toMatchInlineSnapshot(`"Contract has been deprecated, it cannot be published again"`)
  })
})
