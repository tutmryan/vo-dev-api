import { randomUUID } from 'crypto'
import { omit } from 'lodash'
import type { ContractInput } from '../../generated/graphql'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsCredentialAdmin, expectUnauthorizedError } from '../../test'
import { buildTemplateInput, createTemplate } from '../templates/test/create-template'
import { StandardClaims } from './claims'
import { createContractMutation, getDefaultContractInput } from './test/create-contract'

describe('createContract mutation', () => {
  beforeAfterAll()

  async function givenTemplate() {
    const template = await createTemplate(buildTemplateInput({}))

    return { template }
  }

  it('returns an errors when in an anonymous context', async () => {
    // Act
    const { errors } = await executeOperationAnonymous({
      query: createContractMutation,
      variables: {
        input: getDefaultContractInput(),
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it(`returns an error if the template ID doesn't exist`, async () => {
    // Act
    const bogusTemplateId = randomUUID()

    const contractInput = getDefaultContractInput()
    contractInput.templateId = bogusTemplateId

    const { errors } = await executeOperationAsCredentialAdmin({
      query: createContractMutation,
      variables: {
        input: contractInput,
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toContain(`Could not find any entity of type "TemplateEntity"`)
    expect(errors?.[0]?.message).toContain(`"id": "${bogusTemplateId}"`)
  })

  it('returns an error if the contract overrides properties from its template', async () => {
    // Arrange
    const { template } = await givenTemplate()

    // Act
    const { errors } = await executeOperationAsCredentialAdmin({
      query: createContractMutation,
      variables: {
        input: {
          name: 'Contract',
          templateId: template.id,
          isPublic: false,
          validityIntervalInSeconds: 1000,
          credentialTypes: ['DefaultCredential'],
          display: {
            locale: 'fr-FR',
            card: {
              title: 'Updated card title',
              description: 'Card description',
              backgroundColor: '#123123',
              textColor: '#321321',
              issuedBy: 'Card issuer',
              logo: {
                uri: 'https://updated-image.com/updated-image.png',
                description: 'Logo description',
              },
            },
            consent: { title: 'Updated Consent title' },
            claims: [
              { claim: 'claim_one', label: 'Claim 1', type: 'String', value: 'Claim 1' },
              { claim: 'claim_two', label: 'Claim 2', type: 'String', value: 'Updated claim 2' },
            ],
          },
        },
      },
    })

    // Arrange
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toMatchInlineSnapshot(
      `"The contract overrides the following properties from its template: display.locale, display.card.title, display.card.logo.uri, display.consent.title, isPublic, display.claims[claim_two]"`,
    )
  })

  it('returns correct data when there are no errors (no template)', async () => {
    // Arrange
    const input = getDefaultContractInput()
    input.display.claims.push({
      claim: 'claim_name',
      type: 'String',
      value: 'Fixed value',
      label: 'Default claim',
    })

    // Act
    const { data, errors } = await executeOperationAsCredentialAdmin({
      query: createContractMutation,
      variables: {
        input,
      },
    })

    // Assert
    expect(errors).toBeUndefined()
    expect(data).toBeDefined()

    expect(data!.createContract.id).toBeDefined()
    expect(data!.createContract).toMatchObject(input)
  })

  it('returns correct data when there are no errors (with template)', async () => {
    // Arrange
    const { template } = await givenTemplate()

    const input: ContractInput = {
      name: randomUUID(),
      templateId: template.id,
      isPublic: true,
      validityIntervalInSeconds: 1000,
      credentialTypes: ['DefaultCredential'],
      display: {
        locale: 'en-AU',
        card: {
          title: 'Card title',
          issuedBy: 'Card issuer',
          description: 'Card description',
          textColor: '#321321',
          backgroundColor: '#213123',
          logo: {
            uri: 'https://image.com/image.png',
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
    }

    // Act
    const { data, errors } = await executeOperationAsCredentialAdmin({
      query: createContractMutation,
      variables: {
        input,
      },
    })

    // Assert
    expect(errors).toBeUndefined()
    expect(data).toBeDefined()

    expect(data!.createContract.id).toBeDefined()
    expect(data!.createContract).toMatchObject(omit(input, 'templateId'))
  })

  it('validates against including standard claims', async () => {
    // Arrange
    const input = getDefaultContractInput()
    input.display.claims.push({
      claim: StandardClaims.name,
      type: 'String',
      label: 'Standard name claim',
    })

    // Act
    const { errors } = await executeOperationAsCredentialAdmin({
      query: createContractMutation,
      variables: {
        input,
      },
    })

    // Assert
    expect(errors).toMatchInlineSnapshot(`
      [
        {
          "extensions": {
            "code": "INTERNAL_SERVER_ERROR",
          },
          "locations": [
            {
              "column": 3,
              "line": 2,
            },
          ],
          "message": "Claims must not include any of: issuanceId, name",
          "path": [
            "createContract",
          ],
        },
      ]
    `)
  })
})
