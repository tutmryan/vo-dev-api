import { randomUUID } from 'crypto'
import { omit } from 'lodash'
import type { TemplateFragmentFragment } from '../../generated/graphql'
import {
  beforeAfterAll,
  executeOperationAnonymous,
  executeOperationAsCredentialAdmin,
  expectUnauthorizedError,
  fakeJpegDataURL,
  fakePngDataURL,
} from '../../test'
import { mockedServices } from '../../test/mocks'
import { buildTemplateInput, createTemplate } from '../templates/test/create-template'
import { buildContractInput, createContract } from './test/create-contract'
import { deprecateContractMutation } from './test/deprecate-contract'
import { getContract } from './test/get-contract'
import { provisionContractMutation } from './test/provision-contract'
import { getUpdateContractInput, updateContractMutation } from './test/update-contract'

describe('updateContract mutation', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()
    mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
      mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
    )
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

  it('returns an unauthorized error when accessed anonymously', async () => {
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
    expectUnauthorizedError(errors)
  })

  it('returns an error when the updated template overrides properties from its template', async () => {
    // Arrange
    const { contract } = await givenContract({ withTemplate: true })

    // Act
    const input = getUpdateContractInput(contract)
    input.isPublic = false
    input.display.locale = 'fr-FR'
    input.display.card.title = 'Updated card title'
    input.display.card.logo.image = fakePngDataURL()
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
      `"The contract overrides the following properties from its template: display.locale, display.card.title, display.consent.title, isPublic, display.card.logo.image, display.claims[claim_two]"`,
    )
  })

  it('updates the contract when there are no errors (no template)', async () => {
    // Arrange
    const { contract } = await givenContract({})

    // Act
    const input = getUpdateContractInput(contract)
    input.name = 'Updated contract name'
    input.isPublic = false
    input.validityIntervalInSeconds = 500
    input.display.locale = 'en-GB'
    input.display.card.textColor = '#123123'
    input.display.card.logo.image = fakeJpegDataURL()
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

    const updatedContract = await getContract(contract.id)
    expect(updatedContract).toMatchObject(input)
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

    const updatedContract = await getContract(contract.id)
    expect(updatedContract).toMatchObject(omit(input, 'templateId'))
  })

  it('throws error when updating the deprecated contract', async () => {
    // Arrange
    const { contract } = await givenContract({ withTemplate: true })
    const externalContractId = randomUUID()
    mockedServices.adminService.createContract.resolveWith(
      mockedServices.adminService.createContract.buildResolve({ id: externalContractId }),
    )
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
