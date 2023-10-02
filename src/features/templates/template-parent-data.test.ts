import { graphql } from '../../generated'
import { beforeAfterAll, executeOperationAsCredentialAdmin } from '../../test'
import { createTemplate, getEmptyTemplateInput } from './test/create-template'

graphql(
  `
  fragment TemplateParentDataFragment on Template {
    parentData {
      display {
        locale
        card {
          title
          issuedBy
          backgroundColor
          textColor
          description
          logo {
            uri
            image
            description
          }
        }
        consent {
          title
          instructions
        }
        claims {
          label
          claim
          type
          description
          value
        }
      }
      isPublic
      validityIntervalInSeconds
      credentialTypes
    }
  }
  ` as const,
)

const getTemplateParentDataQuery = graphql(
  `
  query GetTemplateParentDataQuery($id: ID!) {
    template(id: $id) {
      ...TemplateParentDataFragment
    }
  }` as const,
)

describe('template.parentData field', () => {
  beforeAfterAll()

  it('returns null when the template has no parent', async () => {
    // Arrange
    const createdTemplate = await createTemplate(getEmptyTemplateInput())

    // Act
    const { data } = await executeOperationAsCredentialAdmin({
      query: getTemplateParentDataQuery,
      variables: {
        id: createdTemplate.id,
      },
    })

    // Assert
    expect(data!.template.parentData).toBeNull()
  })

  it(`returns the parent template's data when there's only 1 level of hierarchy`, async () => {
    // Arrange
    const parentTemplateInput = getEmptyTemplateInput()
    const parentTemplate = await createTemplate({
      ...parentTemplateInput,
      validityIntervalInSeconds: 1_000,
      credentialTypes: ['CredentialType', 'AnotherType'],
      display: {
        ...parentTemplateInput.display,
        locale: 'en-AU',
        consent: { instructions: 'Parent consent instructions' },
        claims: [{ claim: 'parent_claim', label: 'Parent claim', type: 'String' }],
        card: {
          issuedBy: 'Parent template',
          logo: {
            uri: 'https://parent-template.com/image.png',
          },
        },
      },
    })

    const childTemplate = await createTemplate({
      ...getEmptyTemplateInput(),
      parentTemplateId: parentTemplate.id,
    })

    // Act
    const { data } = await executeOperationAsCredentialAdmin({
      query: getTemplateParentDataQuery,
      variables: {
        id: childTemplate.id,
      },
    })

    // Assert
    expect(data!.template.parentData).toMatchObject({
      validityIntervalInSeconds: 1_000,
      credentialTypes: ['CredentialType', 'AnotherType'],
      display: {
        locale: 'en-AU',
        consent: { instructions: 'Parent consent instructions' },
        claims: [{ claim: 'parent_claim', label: 'Parent claim', type: 'String' }],
        card: {
          issuedBy: 'Parent template',
          logo: {
            uri: 'https://parent-template.com/image.png',
          },
        },
      },
    })
  })

  it(`returns the merged representation of data when there are multiple levels of hierarchy`, async () => {
    const rootTemplateInput = getEmptyTemplateInput()
    const rootTemplate = await createTemplate({
      ...rootTemplateInput,
      validityIntervalInSeconds: 1_440,
      credentialTypes: ['RootType'],
      display: {
        ...rootTemplateInput.display,
        consent: { instructions: 'Root template consent instructions' },
        claims: [{ claim: 'standard_claim', label: 'Standard claim', type: 'String' }],
        card: {
          textColor: '#112233',
          issuedBy: 'Root template Pty Ltd',
        },
      },
    })

    const parentTemplateInput = getEmptyTemplateInput()
    const parentTemplate = await createTemplate({
      ...parentTemplateInput,
      parentTemplateId: rootTemplate.id,
      isPublic: false,
      credentialTypes: ['ParentType'],
      display: {
        ...parentTemplateInput.display,
        consent: { title: 'Parent template consent title' },
        claims: [
          { claim: 'parent_template_claim', label: 'Parent template claim', type: 'String' },
          { claim: 'standard_claim', label: 'Standard claim', type: 'String', value: 'Standard claim value' },
        ],
        card: {
          backgroundColor: '#321321',
          title: 'Parent template card title',
          logo: { uri: 'https://parent-template.com/image.png' },
        },
      },
    })

    const childTemplate = await createTemplate({
      ...getEmptyTemplateInput(),
      parentTemplateId: parentTemplate.id,
    })

    // Act
    const { data } = await executeOperationAsCredentialAdmin({
      query: getTemplateParentDataQuery,
      variables: {
        id: childTemplate.id,
      },
    })

    // Assert
    expect(data!.template.parentData).toMatchObject({
      validityIntervalInSeconds: 1_440,
      credentialTypes: ['RootType', 'ParentType'],
      isPublic: false,
      display: {
        consent: {
          instructions: 'Root template consent instructions',
          title: 'Parent template consent title',
        },
        claims: [
          { claim: 'parent_template_claim', label: 'Parent template claim', type: 'String' },
          { claim: 'standard_claim', label: 'Standard claim', type: 'String', value: 'Standard claim value' },
        ],
        card: {
          issuedBy: 'Root template Pty Ltd',
          textColor: '#112233',
          backgroundColor: '#321321',
          title: 'Parent template card title',
          logo: { uri: 'https://parent-template.com/image.png' },
        },
      },
    })
  })
})
