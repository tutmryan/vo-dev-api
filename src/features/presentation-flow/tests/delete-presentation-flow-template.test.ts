import { graphql } from '../../../generated'
import { AppRoles } from '../../../roles'
import { beforeAfterAll, executeOperationAsApp, expectToBeDefinedAndNotNull, expectToBeUndefined } from '../../../test'

const baseInput = {
  name: 'Test template',
  presentationRequest: {
    registration: {
      clientName: 'Test client',
      purpose: 'Test purpose',
    },
    requestedCredentials: [{ type: 'verifiedContractor', acceptedIssuers: ['did:example:123'] }],
  },
  fieldVisibility: {},
}

const createTemplateMutation = graphql(`
  mutation CreatePresentationFlowTemplateForDeleteTest($input: PresentationFlowTemplateInput!) {
    createPresentationFlowTemplate(input: $input) {
      id
      isDeleted
    }
  }
`)

const deleteTemplateMutation = graphql(`
  mutation DeletePresentationFlowTemplateForDeleteTest($id: ID!) {
    deletePresentationFlowTemplate(id: $id)
  }
`)

const getTemplateQuery = graphql(`
  query GetPresentationFlowTemplateForDeleteTest($id: ID!) {
    presentationFlowTemplate(id: $id) {
      id
      isDeleted
    }
  }
`)

describe('PresentationFlowTemplate isDeleted', () => {
  beforeAfterAll()

  it('returns isDeleted = false on a newly created template', async () => {
    const { data, errors } = await executeOperationAsApp(
      { query: createTemplateMutation, variables: { input: baseInput } },
      AppRoles.presentationFlowCreateTemplate,
    )

    expectToBeUndefined(errors)
    expectToBeDefinedAndNotNull(data)
    expect(data.createPresentationFlowTemplate.isDeleted).toBe(false)
  })

  it('returns isDeleted = true after deleting a template', async () => {
    const { data: createData } = await executeOperationAsApp(
      { query: createTemplateMutation, variables: { input: baseInput } },
      AppRoles.presentationFlowCreateTemplate,
    )

    const templateId = createData!.createPresentationFlowTemplate.id

    const { errors: deleteErrors } = await executeOperationAsApp(
      { query: deleteTemplateMutation, variables: { id: templateId } },
      AppRoles.presentationFlowDeleteTemplate,
    )

    expectToBeUndefined(deleteErrors)

    const { data, errors } = await executeOperationAsApp(
      { query: getTemplateQuery, variables: { id: templateId } },
      AppRoles.presentationFlowReadTemplate,
    )

    expectToBeUndefined(errors)
    expectToBeDefinedAndNotNull(data)
    expect(data.presentationFlowTemplate.isDeleted).toBe(true)
  })
})
