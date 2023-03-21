import { randomUUID } from 'crypto'
import { useFragment } from '../../generated'
import type { TemplateInput } from '../../generated/graphql'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsAdmin } from '../../test'
import { createTemplateMutation, getEmptyTemplateInput, TemplateFragment } from './test/create-template'

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

    const template = useFragment(TemplateFragment, data!.createTemplate)

    expect(template.id).toBeDefined()
    expect(template).toMatchObject(input)
  })
})
