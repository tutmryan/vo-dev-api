import { graphql } from '../../../generated'
import { ContactMethod } from '../../../generated/graphql'
import { AppRoles } from '../../../roles'
import { beforeAfterAll, executeOperationAsApp } from '../../../test'

describe('presentation flow template notification configuration', () => {
  beforeAfterAll()

  const createTemplateMutation = graphql(
    `
      mutation CreatePresentationFlowTemplateNotificationTest($input: PresentationFlowTemplateInput!) {
        createPresentationFlowTemplate(input: $input) {
          id
          notification {
            enabled
            enabledVisible
            method
            methodVisible
          }
        }
      }
    ` as const,
  )

  const updateTemplateMutation = graphql(
    `
      mutation UpdatePresentationFlowTemplateNotificationTest($id: ID!, $input: PresentationFlowTemplateInput!) {
        updatePresentationFlowTemplate(id: $id, input: $input) {
          id
          notification {
            enabled
            enabledVisible
            method
            methodVisible
          }
        }
      }
    ` as const,
  )

  const getTemplateMutation = graphql(
    `
      query GetPresentationFlowTemplateNotificationTest($id: ID!) {
        presentationFlowTemplate(id: $id) {
          id
          notification {
            enabled
            enabledVisible
            method
            methodVisible
          }
        }
      }
    ` as const,
  )

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

  it('defaults to disabled/hidden when notification is omitted', async () => {
    const { data, errors } = await executeOperationAsApp(
      { query: createTemplateMutation, variables: { input: baseInput } },
      AppRoles.presentationFlowCreateTemplate,
    )

    expect(errors).toBeUndefined()
    expect(data?.createPresentationFlowTemplate.notification).toEqual({
      enabled: false,
      enabledVisible: false,
      method: null,
      methodVisible: false,
    })
  })

  it('scenario 1: disabled and hidden from runner', async () => {
    const { data, errors } = await executeOperationAsApp(
      {
        query: createTemplateMutation,
        variables: {
          input: {
            ...baseInput,
            notification: { enabled: false, enabledVisible: false, method: null, methodVisible: false },
          },
        },
      },
      AppRoles.presentationFlowCreateTemplate,
    )

    expect(errors).toBeUndefined()
    expect(data?.createPresentationFlowTemplate.notification).toEqual({
      enabled: false,
      enabledVisible: false,
      method: null,
      methodVisible: false,
    })
  })

  it('scenario 2: optional — runner can toggle notification and choose method', async () => {
    const { data, errors } = await executeOperationAsApp(
      {
        query: createTemplateMutation,
        variables: {
          input: {
            ...baseInput,
            notification: { enabled: false, enabledVisible: true, method: null, methodVisible: true },
          },
        },
      },
      AppRoles.presentationFlowCreateTemplate,
    )

    expect(errors).toBeUndefined()
    expect(data?.createPresentationFlowTemplate.notification).toEqual({
      enabled: false,
      enabledVisible: true,
      method: null,
      methodVisible: true,
    })
  })

  it('scenario 3: enabled with full freedom to choose method', async () => {
    const { data, errors } = await executeOperationAsApp(
      {
        query: createTemplateMutation,
        variables: {
          input: {
            ...baseInput,
            notification: { enabled: true, enabledVisible: true, method: null, methodVisible: true },
          },
        },
      },
      AppRoles.presentationFlowCreateTemplate,
    )

    expect(errors).toBeUndefined()
    expect(data?.createPresentationFlowTemplate.notification).toEqual({
      enabled: true,
      enabledVisible: true,
      method: null,
      methodVisible: true,
    })
  })

  it('scenario 4: enabled with method locked to email', async () => {
    const { data, errors } = await executeOperationAsApp(
      {
        query: createTemplateMutation,
        variables: {
          input: {
            ...baseInput,
            notification: { enabled: true, enabledVisible: true, method: ContactMethod.Email, methodVisible: false },
          },
        },
      },
      AppRoles.presentationFlowCreateTemplate,
    )

    expect(errors).toBeUndefined()
    expect(data?.createPresentationFlowTemplate.notification).toEqual({
      enabled: true,
      enabledVisible: true,
      method: ContactMethod.Email,
      methodVisible: false,
    })
  })

  it('scenario 4: enabled with method locked to sms', async () => {
    const { data, errors } = await executeOperationAsApp(
      {
        query: createTemplateMutation,
        variables: {
          input: {
            ...baseInput,
            notification: { enabled: true, enabledVisible: true, method: ContactMethod.Sms, methodVisible: false },
          },
        },
      },
      AppRoles.presentationFlowCreateTemplate,
    )

    expect(errors).toBeUndefined()
    expect(data?.createPresentationFlowTemplate.notification).toEqual({
      enabled: true,
      enabledVisible: true,
      method: ContactMethod.Sms,
      methodVisible: false,
    })
  })

  it('persists notification settings when updating a template', async () => {
    const { data: createData } = await executeOperationAsApp(
      {
        query: createTemplateMutation,
        variables: {
          input: {
            ...baseInput,
            notification: { enabled: false, enabledVisible: false, method: null, methodVisible: false },
          },
        },
      },
      AppRoles.presentationFlowCreateTemplate,
    )

    const templateId = createData!.createPresentationFlowTemplate.id

    const { data, errors } = await executeOperationAsApp(
      {
        query: updateTemplateMutation,
        variables: {
          id: templateId,
          input: {
            ...baseInput,
            notification: { enabled: true, enabledVisible: true, method: ContactMethod.Email, methodVisible: false },
          },
        },
      },
      AppRoles.presentationFlowUpdateTemplate,
    )

    expect(errors).toBeUndefined()
    expect(data?.updatePresentationFlowTemplate.notification).toEqual({
      enabled: true,
      enabledVisible: true,
      method: ContactMethod.Email,
      methodVisible: false,
    })
  })

  it('notification settings are readable via query', async () => {
    const { data: createData } = await executeOperationAsApp(
      {
        query: createTemplateMutation,
        variables: {
          input: {
            ...baseInput,
            notification: { enabled: true, enabledVisible: false, method: ContactMethod.Sms, methodVisible: false },
          },
        },
      },
      AppRoles.presentationFlowCreateTemplate,
    )

    const templateId = createData!.createPresentationFlowTemplate.id

    const { data, errors } = await executeOperationAsApp(
      { query: getTemplateMutation, variables: { id: templateId } },
      AppRoles.presentationFlowReadTemplate,
    )

    expect(errors).toBeUndefined()
    expect(data?.presentationFlowTemplate.notification).toEqual({
      enabled: true,
      enabledVisible: false,
      method: ContactMethod.Sms,
      methodVisible: false,
    })
  })
})
