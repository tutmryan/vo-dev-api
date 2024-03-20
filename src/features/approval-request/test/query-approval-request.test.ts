import { randomUUID } from 'crypto'
import { graphql } from '../../../generated'
import { AppRoles } from '../../../roles'
import type { LimitedApprovalOperationInput } from '../../../test'
import {
  beforeAfterAll,
  buildJwt,
  executeOperationAnonymous,
  executeOperationAs,
  executeOperationAsLimitedApprovalClient,
  expectUnauthorizedError,
} from '../../../test'
import { createApprovalRequest, getDefaultApprovalRequestInput } from './create-approval-request'

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

describe('query approval request', () => {
  beforeAfterAll()

  it('returns approval request when it exists and a presentation has been made', async () => {
    // Arrange
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const approvalRequest = await createApprovalRequest(approvalRequestInput)
    const limitedApprovalInput: LimitedApprovalOperationInput = {
      approvalRequestId: approvalRequest.id,
      presentationId: randomUUID(),
    }
    // Act
    const { data, errors } = await executeOperationAsLimitedApprovalClient(
      {
        query: approvalRequestQuery,
        variables: { approvalRequestId: approvalRequest.id },
      },
      limitedApprovalInput,
    )
    // Assert
    expect(errors).toBeUndefined()
    expect(data).not.toBeNull()
    expect(data?.approvalRequest.id.toLowerCase()).toEqual(approvalRequest.id)
  })

  it('returns unauthorised when no presentation has been made', async () => {
    // Arrange
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const approvalRequest = await createApprovalRequest(approvalRequestInput)
    const limitedApprovalInput: LimitedApprovalOperationInput = {
      approvalRequestId: approvalRequest.id,
    }
    // Act
    const { errors } = await executeOperationAsLimitedApprovalClient(
      {
        query: approvalRequestQuery,
        variables: { approvalRequestId: approvalRequest.id },
      },
      limitedApprovalInput,
    )
    // Assert
    expectUnauthorizedError(errors)
  })

  it('returns unauthorised when requesting a different approval request', async () => {
    // Arrange
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const approvalRequest = await createApprovalRequest(approvalRequestInput)
    const limitedApprovalInput: LimitedApprovalOperationInput = {
      approvalRequestId: randomUUID(),
      presentationId: randomUUID(),
    }
    // Act
    const { errors } = await executeOperationAsLimitedApprovalClient(
      {
        query: approvalRequestQuery,
        variables: { approvalRequestId: approvalRequest.id },
      },
      limitedApprovalInput,
    )
    // Assert
    expectUnauthorizedError(errors)
  })

  it('returns unauthorised when accessed with the right context but the wrong role', async () => {
    // Arrange
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const approvalRequest = await createApprovalRequest(approvalRequestInput)
    const userId = randomUUID()
    const limitedApprovalInput: LimitedApprovalOperationInput = {
      userId,
      approvalRequestId: approvalRequest.id,
      presentationId: randomUUID(),
    }
    const jwtPayload = buildJwt({ oid: userId, roles: [AppRoles.requestApproval] })
    // Act
    const { errors } = await executeOperationAs(
      {
        query: approvalRequestQuery,
        variables: { approvalRequestId: approvalRequest.id },
      },
      jwtPayload,
      undefined,
      limitedApprovalInput,
    )
    // Assert
    expectUnauthorizedError(errors)
  })

  it('returns unauthorised when accessed anonymously', async () => {
    // Arrange
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const approvalRequest = await createApprovalRequest(approvalRequestInput)
    // Act
    const { errors } = await executeOperationAnonymous({
      query: approvalRequestQuery,
      variables: { approvalRequestId: approvalRequest.id },
    })
    // Assert
    expectUnauthorizedError(errors)
  })
})
