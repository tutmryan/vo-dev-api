import { randomUUID } from 'crypto'
import type { TemplateInput } from '../../generated/graphql'
import {
  beforeAfterAll,
  executeOperationAnonymous,
  executeOperationAsCredentialAdmin,
  expectUnauthorizedError,
  fakeJpegDataURL,
  fakePngDataURL,
} from '../../test'
import { mockServiceUtil } from '../../test/mock-services'
import { buildTemplateInput, createTemplate, createTemplateMutation, getEmptyTemplateInput } from './test/create-template'

describe('createTemplate mutation', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockServiceUtil.clearAllMocks()
    mockServiceUtil.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
      mockServiceUtil.blobStorageContainerService.uploadDataUrl.buildResolve,
    )
  })
  it('returns an unauthorized error when accessed anonymously', async () => {
    // Act
    const { errors } = await executeOperationAnonymous({
      query: createTemplateMutation,
      variables: {
        input: buildTemplateInput({}),
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it(`returns an error if the parent template ID doesn't exist`, async () => {
    // Act
    const bogusParentId = randomUUID()
    const { errors } = await executeOperationAsCredentialAdmin({
      query: createTemplateMutation,
      variables: {
        input: buildTemplateInput({ parentTemplateId: bogusParentId }),
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
            image: fakeJpegDataURL(),
          },
        },
      },
    })

    // Act
    const emptyTemplateInput = getEmptyTemplateInput()
    const { errors } = await executeOperationAsCredentialAdmin({
      query: createTemplateMutation,
      variables: {
        input: {
          ...getEmptyTemplateInput(),
          parentTemplateId: parentTemplate.id,
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
                image: fakePngDataURL(), // overridden
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
      `"The template overrides the following properties from its parent: validityIntervalInSeconds, display.card.issuedBy, display.consent.instructions, display.card.logo.image, display.claims[other_parent_claim]"`,
    )
  })

  it('returns correct data when there are no errors', async () => {
    // Arrange
    const input: TemplateInput = buildTemplateInput({
      validityIntervalInSeconds: 3_600,
      display: {
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
            image: fakeJpegDataURL(),
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
    })

    // Act
    const { data, errors } = await executeOperationAsCredentialAdmin({
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
