import casual from 'casual'
import { AppRoles } from '../../../roles'
import { ContactMethod } from '../../../generated/graphql'
import {
  beforeAfterAll,
  executeOperationAsApp,
  expectUnauthorizedError,
} from '../../../test'
import { graphql } from '../../../generated'
import { createPresentationFlow, getDefaultPresentationFlowInput } from './helpers'

const updatePresentationFlowContactMutation = graphql(`
  mutation UpdatePresentationFlowContact($presentationFlowId: UUID!, $contact: PresentationFlowContactInput) {
    updatePresentationFlowContact(presentationFlowId: $presentationFlowId, contact: $contact) {
      id
      hasContactNotificationSet
      notificationStatus
    }
  }
`)

describe('update presentation flow contact mutation', () => {
  beforeAfterAll()

  it('returns an unauthorized error when using the wrong role', async () => {
    const input = await getDefaultPresentationFlowInput()
    const { request } = await createPresentationFlow(input)

    const { errors } = await executeOperationAsApp(
      {
        query: updatePresentationFlowContactMutation,
        variables: {
          presentationFlowId: request.id,
          contact: {
            notification: {
              method: ContactMethod.Email,
              value: casual.email,
            },
          },
        },
      },
      AppRoles.issue,
    )

    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('updates successfully and returns the presentation flow entity', async () => {
    // Arrange
    const input = await getDefaultPresentationFlowInput()
    const { request } = await createPresentationFlow(input)

    const contactInput = {
      notification: {
        method: ContactMethod.Email,
        value: casual.email,
      },
    }

    // Act
    const { data, errors } = await executeOperationAsApp(
      {
        query: updatePresentationFlowContactMutation,
        variables: {
          presentationFlowId: request.id,
          contact: contactInput,
        },
      },
      AppRoles.presentationFlowCreate,
    )

    // Assert
    expect(errors).toBeUndefined()
    expect(data).not.toBeNull()
    expect(data?.updatePresentationFlowContact?.id).toBe(request.id)
    expect(data?.updatePresentationFlowContact?.hasContactNotificationSet).toBe(true)
    expect(data?.updatePresentationFlowContact?.notificationStatus).toBe('PENDING')
  })

  it('clears successfully and returns the presentation flow entity', async () => {
    // Arrange
    const input = await getDefaultPresentationFlowInput()
    input.contact = {
      notification: {
        method: ContactMethod.Email,
        value: casual.email,
      },
    }
    const { request } = await createPresentationFlow(input)
    expect(request.hasContactNotificationSet).toBe(true)

    // Act
    const { data, errors } = await executeOperationAsApp(
      {
        query: updatePresentationFlowContactMutation,
        variables: {
          presentationFlowId: request.id,
          contact: null,
        },
      },
      AppRoles.presentationFlowCreate,
    )

    // Assert
    expect(errors).toBeUndefined()
    expect(data).not.toBeNull()
    expect(data?.updatePresentationFlowContact?.id).toBe(request.id)
    expect(data?.updatePresentationFlowContact?.hasContactNotificationSet).toBe(false)
    expect(data?.updatePresentationFlowContact?.notificationStatus).toBeNull()
  })
})
