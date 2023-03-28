import { beforeAfterAll, executeOperationAnonymous, executeOperationAsAdmin } from '../../test'
import { getUpdateContractInput, updateContractMutation } from './test/update-contract'
import { createContract } from './test/create-contract'
import { getContract } from './test/get-contract'
import type { TemplateFragmentFragment } from '../../generated/graphql'
import { createTemplate, getEmptyTemplateInput } from '../templates/test/create-template'
import { randomUUID } from 'crypto'

describe('updateContract mutation', () => {
  beforeAfterAll()

  async function givenContract({ withTemplate = false }: { withTemplate?: boolean }) {
    let template: TemplateFragmentFragment | undefined = undefined
    if (withTemplate) {
      template = await createTemplate({
        ...getEmptyTemplateInput(),
        isPublic: true,
        display: {
          locale: 'en-AU',
          card: {
            title: 'Card title',
            logo: { image: 'https://image.com/image.png' },
          },
          consent: { title: 'Consent title' },
          claims: [
            { claim: 'claim_one', label: 'Claim 1', type: 'String' },
            { claim: 'claim_two', label: 'Claim 2', type: 'String', value: 'Claim 2' },
          ],
        },
      })
    }

    const contract = await createContract({
      name: randomUUID(),
      description: randomUUID(),
      templateID: withTemplate ? template!.id : null,
      isPublic: true,
      validityIntervalInSeconds: 1000,
      credentialTypes: ['DefaultCredential'],
      display: {
        locale: 'en-AU',
        card: {
          title: 'Card title',
          description: 'Card description',
          backgroundColor: '#123123',
          textColor: '#321321',
          issuedBy: 'Card issuer',
          logo: {
            image: 'https://image.com/image.png',
            description: 'Logo description',
          },
        },
        consent: {
          title: 'Consent title',
          instructions: 'Consent instructions',
        },
        claims: [
          { claim: 'claim_one', label: 'Claim 1', type: 'String', value: 'Claim 1' },
          { claim: 'claim_two', label: 'Claim 2', type: 'String', value: 'Claim 2' },
        ],
      },
    })

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
    input.display.card.logo.image = 'https://updated-image.com/updated-image.png'
    input.display.consent.title = 'Updated consent title'
    input.display.claims[1]!.value = 'Updated Claim 2'

    const { errors } = await executeOperationAsAdmin({
      query: updateContractMutation,
      variables: {
        id: contract.id,
        input,
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toMatchInlineSnapshot(
      `"The contract overrides the following properties from its template: display.locale, display.card.title, display.card.logo.image, display.consent.title, isPublic, display.claims[claim_two]"`,
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

    const { errors } = await executeOperationAsAdmin({
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

    const { errors } = await executeOperationAsAdmin({
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
})
