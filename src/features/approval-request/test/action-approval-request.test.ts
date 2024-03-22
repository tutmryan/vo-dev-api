import { addDays } from 'date-fns'
import { ApprovalRequestStatus } from '../../../generated/graphql'
import type { LimitedApprovalOperationInput } from '../../../test'
import { beforeAfterAll, executeOperationAsLimitedApprovalClient, expectToBeDefined, expectUnauthorizedError } from '../../../test'
import {
  actionApprovalRequestMutation,
  createApprovalRequest,
  createApprovalRequestWithPresentation,
  getDefaultApprovalRequestInput,
} from './create-approval-request'

describe('action approval request', () => {
  beforeAfterAll()

  it('can be approved', async () => {
    // Arrange
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const { presentation, approvalRequest } = await createApprovalRequestWithPresentation(approvalRequestInput)
    const limitedApprovalInput: LimitedApprovalOperationInput = {
      approvalRequestId: approvalRequest.id,
      presentationId: presentation.id,
    }
    // Act
    const { data, errors } = await executeOperationAsLimitedApprovalClient(
      {
        query: actionApprovalRequestMutation,
        variables: { id: approvalRequest.id, input: { isApproved: true, actionedComment: 'I hereby approve this request' } },
      },
      limitedApprovalInput,
    )
    // Assert
    expect(errors).toBeUndefined()
    expect(data).not.toBeNull()
    expect(data?.actionApprovalRequest.id.toLowerCase()).toEqual(approvalRequest.id)
    expect(data?.actionApprovalRequest.status).toEqual(ApprovalRequestStatus.Approved)
    expect(data?.actionApprovalRequest.isApproved).toEqual(true)
    expect(data?.actionApprovalRequest.actionedComment).toEqual('I hereby approve this request')
  })

  it('can be rejected', async () => {
    // Arrange
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const { presentation, approvalRequest } = await createApprovalRequestWithPresentation(approvalRequestInput)
    const limitedApprovalInput: LimitedApprovalOperationInput = {
      approvalRequestId: approvalRequest.id,
      presentationId: presentation.id,
    }
    // Act
    const { data, errors } = await executeOperationAsLimitedApprovalClient(
      {
        query: actionApprovalRequestMutation,
        variables: { id: approvalRequest.id, input: { isApproved: false, actionedComment: 'I cannot approve this request' } },
      },
      limitedApprovalInput,
    )
    // Assert
    expect(errors).toBeUndefined()
    expect(data).not.toBeNull()
    expect(data?.actionApprovalRequest.id.toLowerCase()).toEqual(approvalRequest.id)
    expect(data?.actionApprovalRequest.status).toEqual(ApprovalRequestStatus.Rejected)
    expect(data?.actionApprovalRequest.isApproved).toEqual(false)
    expect(data?.actionApprovalRequest.actionedComment).toEqual('I cannot approve this request')
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
        query: actionApprovalRequestMutation,
        variables: { id: approvalRequest.id, input: { isApproved: true, actionedComment: 'I hereby approve this request' } },
      },
      limitedApprovalInput,
    )
    // Assert
    expectUnauthorizedError(errors)
  })

  it('returns an error when request is not pending', async () => {
    // Arrange
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const { presentation, approvalRequest } = await createApprovalRequestWithPresentation(approvalRequestInput)
    const limitedApprovalInput: LimitedApprovalOperationInput = {
      approvalRequestId: approvalRequest.id,
      presentationId: presentation.id,
    }
    await executeOperationAsLimitedApprovalClient(
      {
        query: actionApprovalRequestMutation,
        variables: { id: approvalRequest.id, input: { isApproved: true, actionedComment: 'I hereby approve this request' } },
      },
      limitedApprovalInput,
    )
    // Act
    const { errors } = await executeOperationAsLimitedApprovalClient(
      {
        query: actionApprovalRequestMutation,
        variables: { id: approvalRequest.id, input: { isApproved: true, actionedComment: 'I hereby approve this request again' } },
      },
      limitedApprovalInput,
    )
    // Assert
    expectToBeDefined(errors)
    expectToBeDefined(errors[0])
    expect(errors[0].message).toMatchInlineSnapshot(`"Cannot action an approval request that is approved"`)
  })

  it('returns an error when request is expired', async () => {
    // Arrange
    const approvalRequestInput = getDefaultApprovalRequestInput()
    approvalRequestInput.expiresAt = addDays(new Date(), -1)
    const { presentation, approvalRequest } = await createApprovalRequestWithPresentation(approvalRequestInput)
    const limitedApprovalInput: LimitedApprovalOperationInput = {
      approvalRequestId: approvalRequest.id,
      presentationId: presentation.id,
    }
    // Act
    const { errors } = await executeOperationAsLimitedApprovalClient(
      {
        query: actionApprovalRequestMutation,
        variables: { id: approvalRequest.id, input: { isApproved: true, actionedComment: 'I hereby approve this request' } },
      },
      limitedApprovalInput,
    )
    // Assert
    expectToBeDefined(errors)
    expectToBeDefined(errors[0])
    expect(errors[0].message).toMatchInlineSnapshot(`"Cannot action an approval request that is expired"`)
  })
})
