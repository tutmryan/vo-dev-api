import { randomUUID } from 'crypto'
import { omit } from 'lodash'
import type { TemplateFragmentFragment } from '../../generated/graphql'
import { mock as AdminService, mockCreateContract } from '../../services/__mocks__/admin'
import { mock as BlobStorageContainerService } from '../../services/__mocks__/blob-storage-container-service'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsCredentialAdmin } from '../../test'
import { buildTemplateInput, createTemplate } from '../templates/test/create-template'
import { buildContractInput, createContract } from './test/create-contract'
import { deprecateContractMutation } from './test/deprecate-contract'
import { getContract } from './test/get-contract'
import { provisionContractMutation } from './test/provision-contract'
import { getUpdateContractInput, updateContractMutation } from './test/update-contract'

jest.mock('../../services/admin')
jest.mock('../../services/blob-storage-container-service')

describe('updateContract mutation', () => {
  beforeAfterAll()
  beforeEach(() => {
    AdminService.clearAllMocks()
    BlobStorageContainerService.clearAllMocks()
  })

  async function givenContract({ withTemplate = false }: { withTemplate?: boolean }) {
    let template: TemplateFragmentFragment | undefined = undefined
    if (withTemplate) {
      template = await createTemplate(buildTemplateInput({}))
    }

    const contract = await createContract(
      buildContractInput({
        templateId: withTemplate ? template!.id : null,
      }),
    )

    return { contract }
  }

  it('returns an errors when in an anonymous context', async () => {
    // Arrange
    const { contract } = await givenContract({})

    // Act
    const { errors } = await executeOperationAnonymous({
      query: updateContractMutation,
      variables: {
        id: contract.id,
        input: getUpdateContractInput(contract),
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toBe('Not Authorised!')
  })

  it('returns an error when the updated template overrides properties from its template', async () => {
    // Arrange
    const { contract } = await givenContract({ withTemplate: true })

    // Act
    const input = getUpdateContractInput(contract)
    input.isPublic = false
    input.display.locale = 'fr-FR'
    input.display.card.title = 'Updated card title'
    input.display.card.logo.uri = 'https://updated-image.com/updated-image.png'
    input.display.consent.title = 'Updated consent title'
    input.display.claims[1]!.value = 'Updated Claim 2'

    const { errors } = await executeOperationAsCredentialAdmin({
      query: updateContractMutation,
      variables: {
        id: contract.id,
        input,
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toMatchInlineSnapshot(
      `"The contract overrides the following properties from its template: display.locale, display.card.title, display.card.logo.uri, display.consent.title, isPublic, display.claims[claim_two]"`,
    )
  })

  it('updates the contract when there are no errors (no template)', async () => {
    // Arrange
    const { contract } = await givenContract({})

    // Act
    const input = getUpdateContractInput(contract)
    input.name = 'Updated contract name'
    input.description = 'Updated contract description'
    input.isPublic = false
    input.validityIntervalInSeconds = 500
    input.display.locale = 'en-GB'
    input.display.card.textColor = '#123123'
    input.display.card.logo.uri = 'https://template.com/image.png'
    input.display.claims = [{ claim: 'claim_name', label: 'Claim', type: 'String', value: 'Updated claim value' }]
    input.display.consent.title = 'Updated consent title'

    const { errors } = await executeOperationAsCredentialAdmin({
      query: updateContractMutation,
      variables: {
        id: contract.id,
        input,
      },
    })

    // Assert
    expect(errors).toBeUndefined()

    const updatedTemplate = await getContract(contract.id)
    expect(updatedTemplate).toMatchObject(input)
  })

  it('updates the contract when there are no errors (with template)', async () => {
    // Arrange
    const { contract } = await givenContract({ withTemplate: true })

    // Act
    const input = getUpdateContractInput(contract)
    input.validityIntervalInSeconds = 1500
    input.display.card.description = 'Updated card description'
    input.display.card.logo.description = 'Updated logo description'
    input.display.consent.instructions = 'Updated consent instructions'
    input.display.claims[0]!.value = 'Updated Claim 1'

    const { errors } = await executeOperationAsCredentialAdmin({
      query: updateContractMutation,
      variables: {
        id: contract.id,
        input,
      },
    })

    // Assert
    expect(errors).toBeUndefined()

    const updatedTemplate = await getContract(contract.id)
    expect(updatedTemplate).toMatchObject(omit(input, 'templateId'))
  })

  it('throws error when updating the deprecated contract', async () => {
    // Arrange
    const { contract } = await givenContract({ withTemplate: true })
    const externalContractId = randomUUID()
    mockCreateContract.mockResolvedValue({ id: externalContractId })
    //publishing for the first time
    await executeOperationAsCredentialAdmin({
      query: provisionContractMutation,
      variables: {
        id: contract.id,
      },
    })
    //deprecating the contract
    await executeOperationAsCredentialAdmin({
      query: deprecateContractMutation,
      variables: {
        id: contract.id,
      },
    })

    // Act
    const input = getUpdateContractInput(contract)
    input.display.card.description = 'Updated card description'

    const { errors } = await executeOperationAsCredentialAdmin({
      query: updateContractMutation,
      variables: {
        id: contract.id,
        input,
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toMatchInlineSnapshot(`"Contract has been deprecated, it cannot be updated"`)
  })
})
