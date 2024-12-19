import { randomUUID } from 'crypto'
import { ClaimType, type TemplateInput } from '../../generated/graphql'
import { AppRoles } from '../../roles'
import {
  beforeAfterAll,
  executeOperationAnonymous,
  executeOperationAsApp,
  executeOperationAsCredentialAdmin,
  expectUnauthorizedError,
  fakeJpegDataURL,
  fakePngDataURL,
} from '../../test'
import { mockedServices } from '../../test/mocks'
import { buildTemplateInput, createTemplate, createTemplateMutation, getEmptyTemplateInput } from './test/create-template'

describe('createTemplate mutation', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()
    mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
      mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
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
          { claim: 'parent_claim', label: 'Parent claim', type: ClaimType.Text },
          { claim: 'other_parent_claim', label: 'Other parent claim', type: ClaimType.Text, value: 'Fixed', description: 'Description' },
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
            claims: [
              { claim: 'other_parent_claim', label: 'Other parent claim', type: ClaimType.Text, value: 'Overridden, will cause error' },
            ],
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
            type: ClaimType.Text,
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

  it('works with the ContractAdmin application role', async () => {
    // Arrange
    const input: TemplateInput = buildTemplateInput({})

    // Act
    const { data, errors } = await executeOperationAsApp(
      {
        query: createTemplateMutation,
        variables: {
          input,
        },
      },
      AppRoles.contractAdmin,
    )

    // Assert
    expect(errors).toBeUndefined()
    expect(data).toBeDefined()
  })
})
