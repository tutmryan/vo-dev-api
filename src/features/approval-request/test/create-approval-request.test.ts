import { ApprovalRequestStatus, type PresentationRequestInput } from '../../../generated/graphql'
import { AppRoles } from '../../../roles'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsApp, expectUnauthorizedError } from '../../../test'
import { createApprovalRequestMutation, getDefaultApprovalRequestInput } from './create-approval-request'

describe('create approval request mutation', () => {
  beforeAfterAll()

  it('returns an error when in an anonymous context', async () => {
    // Act
    const { errors } = await executeOperationAnonymous({
      query: createApprovalRequestMutation,
      variables: {
        input: getDefaultApprovalRequestInput(),
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns an error when using the wrong role', async () => {
    // Act
    const { errors } = await executeOperationAsApp(
      {
        query: createApprovalRequestMutation,
        variables: {
          input: getDefaultApprovalRequestInput(),
        },
      },
      AppRoles.issue,
    )

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('creates the approval request successfully', async () => {
    // Arrange
    const sampleInput = getDefaultApprovalRequestInput()

    // Act
    const { data, errors } = await executeOperationAsApp(
      {
        query: createApprovalRequestMutation,
        variables: {
          input: sampleInput,
        },
      },
      AppRoles.requestApproval,
    )

    // Assert
    expect(errors).toBeUndefined()
    expect(data).not.toBeNull()
    expect(data?.createApprovalRequest.id).not.toBeNull()
    expect(data?.createApprovalRequest.expiresAt).toEqual(sampleInput.expiresAt)
    expect((data?.createApprovalRequest.presentationRequest as PresentationRequestInput).requestedCredentials[0]?.type).toEqual(
      'verifiedContractor',
    )
    expect(data?.createApprovalRequest.status).toEqual(ApprovalRequestStatus.Pending)
  })
})
