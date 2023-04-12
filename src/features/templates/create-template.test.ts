import { randomUUID } from 'crypto'
import type { TemplateInput } from '../../generated/graphql'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsAdmin } from '../../test'
import { createTemplate, createTemplateMutation, getEmptyTemplateInput } from './test/create-template'

describe('createTemplate mutation', () => {
  beforeAfterAll()

  it('returns an errors when in an anonymous context', async () => {
    // Act
    const { errors } = await executeOperationAnonymous({
      query: createTemplateMutation,
      variables: {
        input: getEmptyTemplateInput(),
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toBe('Not Authorised!')
  })

  it(`returns an error if the parent template ID doesn't exist`, async () => {
    // Act
    const bogusParentId = randomUUID()
    const { errors } = await executeOperationAsAdmin({
      query: createTemplateMutation,
      variables: {
        input: {
          ...getEmptyTemplateInput(),
          parentTemplateID: bogusParentId,
        },
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toContain(`Could not find any entity of type "TemplateEntity"`)
    expect(errors?.[0]?.message).toContain(`"id": "${bogusParentId}"`)
  })

  it('returns an error when the new template overrides a property set on the parent template', async () => {
    // Arrange
    const parentTemplateInput = getEmptyTemplateInput()
    const parentTemplate = await createTemplate({
      ...parentTemplateInput,
      validityIntervalInSeconds: 1_000,
      display: {
        ...parentTemplateInput.display,
        locale: 'en-AU',
        consent: { instructions: 'Parent consent instructions' },
        claims: [
          { claim: 'parent_claim', label: 'Parent claim', type: 'String' },
          { claim: 'other_parent_claim', label: 'Other parent claim', type: 'String', value: 'Fixed', description: 'Description' },
        ],
        card: {
          issuedBy: 'Parent template',
          logo: {
            uri: 'https://parent-template.com/image.png',
          },
        },
      },
    })

    // Act
    const emptyTemplateInput = getEmptyTemplateInput()
    const { errors } = await executeOperationAsAdmin({
      query: createTemplateMutation,
      variables: {
        input: {
          ...getEmptyTemplateInput(),
          parentTemplateID: parentTemplate.id,
          validityIntervalInSeconds: 1_500,
          display: {
            ...emptyTemplateInput.display,
            consent: {
              instructions: 'Overridden instructions that will cause an error',
              title: 'Fresh title that will not cause an error',
            },
            claims: [{ claim: 'other_parent_claim', label: 'Other parent claim', type: 'String', value: 'Overridden, will cause error' }],
            card: {
              backgroundColor: '#222333',
              issuedBy: 'Overridden issuedBy which will cause an error',
              logo: {
                uri: 'https://overridden-image.which/will-cause-an-error.png',
                description: 'Fresh logo description, no worries',
              },
            },
          },
        },
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toMatchInlineSnapshot(
      `"The template overrides the following properties from its parent: validityIntervalInSeconds, display.card.issuedBy, display.card.logo.uri, display.consent.instructions, display.claims[other_parent_claim]"`,
    )
  })

  it('returns correct data when there are no errors', async () => {
    // Arrange
    const input: TemplateInput = {
      ...getEmptyTemplateInput(),
      isPublic: true,
      validityIntervalInSeconds: 3_600,
      display: {
        locale: 'en-AU',
        consent: {
          title: 'Consent title',
          instructions: 'Consent instructions',
        },
        card: {
          title: 'Card title',
          description: 'Card description',
          issuedBy: 'Card issuer',
          textColor: '#123123',
          backgroundColor: '#321321',
          logo: {
            description: 'Logo description',
            uri: 'https://makerx.com.au/credential.png',
          },
        },
        claims: [
          {
            claim: 'firstName',
            label: 'First name',
            type: 'String',
          },
        ],
      },
    }

    // Act
    const { data, errors } = await executeOperationAsAdmin({
      query: createTemplateMutation,
      variables: {
        input,
      },
    })

    // Assert
    expect(errors).toBeUndefined()
    expect(data).toBeDefined()

    expect(data!.createTemplate.id).toBeDefined()
    expect(data!.createTemplate).toMatchObject(input)
  })
})
