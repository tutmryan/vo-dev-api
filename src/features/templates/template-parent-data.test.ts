import { graphql } from '../../generated'
import { ClaimType } from '../../generated/graphql'
import { beforeAfterAll, executeOperationAsCredentialAdmin, fakeJpegDataURL } from '../../test'
import { mockedServices } from '../../test/mocks'
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
  beforeEach(() => {
    mockedServices.clearAllMocks()
    mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
      mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
    )
  })
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
        claims: [{ claim: 'parent_claim', label: 'Parent claim', type: ClaimType.Text }],
        card: {
          issuedBy: 'Parent template',
          logo: {
            image: fakeJpegDataURL(),
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
    expect(data!.template.parentData).toMatchInlineSnapshot(`
      {
        "credentialTypes": [
          "CredentialType",
          "AnotherType",
        ],
        "display": {
          "card": {
            "backgroundColor": null,
            "description": null,
            "issuedBy": "Parent template",
            "logo": {
              "description": null,
              "uri": "https://mock.blob.net/jpeg123==.jpg",
            },
            "textColor": null,
            "title": null,
          },
          "claims": [
            {
              "claim": "parent_claim",
              "description": null,
              "label": "Parent claim",
              "type": "text",
              "value": null,
            },
          ],
          "consent": {
            "instructions": "Parent consent instructions",
            "title": null,
          },
          "locale": "en-AU",
        },
        "isPublic": null,
        "validityIntervalInSeconds": 1000,
      }
    `)
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
        claims: [{ claim: 'standard_claim', label: 'Standard claim', type: ClaimType.Text }],
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
          { claim: 'parent_template_claim', label: 'Parent template claim', type: ClaimType.Text },
          { claim: 'standard_claim', label: 'Standard claim', type: ClaimType.Text, value: 'Standard claim value' },
        ],
        card: {
          backgroundColor: '#321321',
          title: 'Parent template card title',
          logo: { image: fakeJpegDataURL() },
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
    expect(data!.template.parentData).toMatchInlineSnapshot(`
      {
        "credentialTypes": [
          "RootType",
          "ParentType",
        ],
        "display": {
          "card": {
            "backgroundColor": "#321321",
            "description": null,
            "issuedBy": "Root template Pty Ltd",
            "logo": {
              "description": null,
              "uri": "https://mock.blob.net/jpeg123==.jpg",
            },
            "textColor": "#112233",
            "title": "Parent template card title",
          },
          "claims": [
            {
              "claim": "parent_template_claim",
              "description": null,
              "label": "Parent template claim",
              "type": "text",
              "value": null,
            },
            {
              "claim": "standard_claim",
              "description": null,
              "label": "Standard claim",
              "type": "text",
              "value": "Standard claim value",
            },
          ],
          "consent": {
            "instructions": "Root template consent instructions",
            "title": "Parent template consent title",
          },
          "locale": null,
        },
        "isPublic": false,
        "validityIntervalInSeconds": 1440,
      }
    `)
  })
})
