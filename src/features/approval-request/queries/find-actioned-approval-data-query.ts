import type { QueryContext } from '../../../cqs'
import type { ActionedApprovalData } from '../../../generated/graphql'
import { ApprovalRequestStatus } from '../../../generated/graphql'
import { ApprovalRequestEntity } from '../entities/approval-request-entity'

export async function FindActionedApprovalDataQuery(this: QueryContext, id: string): Promise<ActionedApprovalData | null> {
  const { entityManager } = this

  const approvalRequest = await entityManager.getRepository(ApprovalRequestEntity).findOneByOrFail({ id })
  const terminalApprovalRequestStatuses = [ApprovalRequestStatus.Approved, ApprovalRequestStatus.Rejected]

  if (!terminalApprovalRequestStatuses.includes(approvalRequest.status)) {
    return null
  }

  const presentation = await approvalRequest.presentation
  const identity = await presentation.identity

  return {
    approvalRequestId: approvalRequest.id,
    correlationId: approvalRequest.correlationId,
    requestData: approvalRequest.requestData,
    state: approvalRequest.callbackInput?.state,
    isApproved: approvalRequest.isApproved!,
    actionedComment: approvalRequest.actionedComment,
    actionedAt: approvalRequest.updatedAt!,
    actionedBy: identity ? { id: identity.id, name: identity.name } : null,
    callbackSecret: approvalRequest.callbackSecret,
  }
}
