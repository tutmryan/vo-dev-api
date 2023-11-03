import { randomUUID } from 'crypto'
import type { TemplateFragmentFragment } from '../../generated/graphql'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsCredentialAdmin, expectUnauthorizedError } from '../../test'
import { createTemplate, getEmptyTemplateInput } from './test/create-template'
import { getTemplate } from './test/get-template'
import { getUpdateTemplateInput, updateTemplateMutation } from './test/update-template'

describe('updateTemplate mutation', () => {
  beforeAfterAll()

  async function givenTemplate({ hasParent = false, hasChildren = false }: { hasParent?: boolean; hasChildren?: boolean }) {
    let parentTemplate: TemplateFragmentFragment | undefined = undefined
    if (hasParent) {
      parentTemplate = await createTemplate({
        name: 'Parent template',
        credentialTypes: ['ParentType'],
        display: {
          card: {
            backgroundColor: '#222222',
            logo: { uri: 'https://parent-image.com/logo.png' },
          },
          consent: { title: 'Parent template consent title' },
          claims: [{ claim: 'parent_claim', label: 'Parent claim', type: 'String', value: 'value' }],
        },
      })
    }

    const template = await createTemplate({
      name: 'SUT template',
      parentTemplateId: parentTemplate?.id,
    })

    if (hasChildren) {
      await createTemplate({
        name: 'Child template',
        parentTemplateId: template.id,
      })
    }

    return { template }
  }

  it('returns an errors when in an anonymous context', async () => {
    // Arrange
    const { template } = await givenTemplate({})

    // Act
    const { errors } = await executeOperationAnonymous({
      query: updateTemplateMutation,
      variables: {
        id: template.id,
        input: getUpdateTemplateInput(template),
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it(`returns an error if the template ID doesn't exist`, async () => {
    // Act
    const bogusTemplateId = randomUUID()
    const { errors } = await executeOperationAsCredentialAdmin({
      query: updateTemplateMutation,
      variables: {
        id: bogusTemplateId,
        input: getEmptyTemplateInput(),
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toContain(`Could not find any entity of type "TemplateEntity"`)
    expect(errors?.[0]?.message).toContain(`"id": "${bogusTemplateId}"`)
  })

  it('returns an error when the updated template overrides a property set on the parent template', async () => {
    // Arrange
    const { template } = await givenTemplate({ hasParent: true })

    // Act
    const { errors } = await executeOperationAsCredentialAdmin({
      query: updateTemplateMutation,
      variables: {
        id: template.id,
        input: {
          ...getUpdateTemplateInput(template),
          // No errors here as they're not set on the parent template
          isPublic: true,
          validityIntervalInSeconds: 1_500,
          // This will cause an error as it's set on the parent template
          credentialTypes: ['ParentType'],
          display: {
            // No error here either
            locale: 'en-AU',
            card: {
              textColor: '#123123',
              backgroundColor: '#321321',
              logo: {
                uri: 'https://image.which/will-cause-an-error.png',
                description: 'Fresh logo description, no worries',
              },
            },
            consent: {
              instructions: 'No errors',
              title: 'Error as it is set on the parent',
            },
            claims: [
              { claim: 'parent_claim', label: 'Parent claim', type: 'String', value: 'Overridden, will cause error' },
              { claim: 'template_claim', label: 'Template claim', type: 'String', value: 'No error' },
            ],
          },
        },
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toMatchInlineSnapshot(
      `"The template overrides the following properties from its parent: display.card.backgroundColor, display.card.logo.uri, display.consent.title, display.claims[parent_claim], credentialTypes[ParentType]"`,
    )
  })

  it('updates the template when there are no errors', async () => {
    // Arrange
    const { template } = await givenTemplate({})

    // Act
    const { errors } = await executeOperationAsCredentialAdmin({
      query: updateTemplateMutation,
      variables: {
        id: template.id,
        input: {
          ...getUpdateTemplateInput(template),
          name: 'Updated SUT template',
          isPublic: true,
          validityIntervalInSeconds: 1_000,
          display: {
            locale: 'en-AU',
            card: {
              textColor: '#123123',
              logo: { uri: 'https://template.com/image.png' },
            },
            claims: [{ claim: 'claim', label: 'Claim', type: 'String', value: 'Claim' }],
            consent: { title: 'Consent title' },
          },
        },
      },
    })

    // Assert
    expect(errors).toBeUndefined()

    const updatedTemplate = await getTemplate(template.id)
    expect(updatedTemplate).toMatchObject({
      ...getUpdateTemplateInput(template),
      name: 'Updated SUT template',
      isPublic: true,
      validityIntervalInSeconds: 1_000,
      display: {
        locale: 'en-AU',
        card: {
          textColor: '#123123',
          logo: { uri: 'https://template.com/image.png' },
        },
        claims: [{ claim: 'claim', label: 'Claim', type: 'String', value: 'Claim' }],
        consent: { title: 'Consent title' },
      },
    })
  })
})
