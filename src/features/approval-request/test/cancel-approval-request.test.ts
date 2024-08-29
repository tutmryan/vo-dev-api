import { randomUUID } from 'crypto'
import { graphql } from '../../../generated'
import { ApprovalRequestStatus } from '../../../generated/graphql'
import { AppRoles } from '../../../roles'
import {
  beforeAfterAll,
  buildJwt,
  executeOperation,
  executeOperationAnonymous,
  executeOperationAsLimitedApprovalClient,
  expectUnauthorizedError,
  LimitedApprovalOperationInput,
} from '../../../test'
import { createActionedApprovalRequest, createApprovalRequest, getDefaultApprovalRequestInput } from './create-approval-request'

const cancelApprovalRequestMutation = graphql(
  `
    mutation CancelApprovalRequest($id: ID!) {
      cancelApprovalRequest(id: $id)
    }
  ` as const,
)

const approvalRequestQuery = graphql(`
  query ApprovalRequest($approvalRequestId: ID!) {
    approvalRequest(id: $approvalRequestId) {
      id
      requestedAt
      expiresAt
      requestType
      correlationId
      referenceUrl
      purpose
      requestData
      actionedComment
      status
    }
  }
`)

describe('cancel approval request mutation', () => {
  beforeAfterAll()

  it('returns an unauthorized error when accessed anonymously', async () => {
    // Arrange
    const jwt = buildJwt({ roles: [AppRoles.requestApproval] })
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const approvalRequest = await createApprovalRequest(approvalRequestInput, jwt)
    // Act
    const { errors } = await executeOperationAnonymous({
      query: cancelApprovalRequestMutation,
      variables: {
        id: approvalRequest.id,
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns an error when using the wrong role', async () => {
    // Arrange
    const jwtWithWrongRole = buildJwt({ roles: [AppRoles.issue] })
    const approvalRequestInput = getDefaultApprovalRequestInput()

    // this should be created with the same jwt but we can't create the request with the wrong role!
    // still proves the point for the test though.
    const approvalRequest = await createApprovalRequest(approvalRequestInput)
    // Act
    const { errors } = await executeOperation(
      {
        query: cancelApprovalRequestMutation,
        variables: {
          id: approvalRequest.id,
        },
      },
      jwtWithWrongRole,
    )

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns an error when cancelling completed requests', async () => {
    // Arrange
    const jwt = buildJwt({ roles: [AppRoles.requestApproval] })
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const approvalRequest = await createActionedApprovalRequest(approvalRequestInput, true, 'approved', jwt)

    // Act
    const { errors } = await executeOperation(
      {
        query: cancelApprovalRequestMutation,
        variables: {
          id: approvalRequest.approvalRequest.id,
        },
      },
      jwt,
    )

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toContain('Only pending requests can be cancelled.')
  })

  it('returns an error when a user other than the creator tries to cancel', async () => {
    // Arrange
    const jwt1 = buildJwt({ roles: [AppRoles.requestApproval] })
    const jwt2 = buildJwt({ roles: [AppRoles.requestApproval] })
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const approvalRequest = await createApprovalRequest(approvalRequestInput, jwt1)

    // Act
    const { errors } = await executeOperation(
      {
        query: cancelApprovalRequestMutation,
        variables: {
          id: approvalRequest.id,
        },
      },
      jwt2,
    )

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toContain('User does not have permission to cancel this approval request')
  })

  it('cancels the approval request successfully', async () => {
    // Arrange
    const jwt = buildJwt({ roles: [AppRoles.requestApproval] })
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const approvalRequest = await createApprovalRequest(approvalRequestInput, jwt)

    // Act
    const { errors } = await executeOperation(
      {
        query: cancelApprovalRequestMutation,
        variables: {
          id: approvalRequest.id,
        },
      },
      jwt,
    )

    // Assert
    expect(errors).toBeUndefined()

    // read the approval request back to ensure it was updated
    {
      const limitedApprovalInput: LimitedApprovalOperationInput = {
        approvalRequestId: approvalRequest.id,
        presentationId: randomUUID(),
      }
      const { data, errors } = await executeOperationAsLimitedApprovalClient(
        {
          query: approvalRequestQuery,
          variables: { approvalRequestId: approvalRequest.id },
        },
        limitedApprovalInput,
      )

      expect(errors).toBeUndefined()
      expect(data).not.toBeNull()
      expect(data?.approvalRequest.id.toLowerCase()).toEqual(approvalRequest.id)
      expect(data?.approvalRequest.status).toEqual(ApprovalRequestStatus.Cancelled)
    }
  })
})
