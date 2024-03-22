import { extractErrorResponseInfo } from '@makerx/node-common'
import type { CommandContext } from '../../../cqs'
import type { ActionApprovalRequestInput, ActionedApprovalData } from '../../../generated/graphql'
import { userInvariant } from '../../../util/user-invariant'
import { ApprovalRequestEntity } from '../entities/approval-request-entity'

export async function ActionApprovalRequestCommand(this: CommandContext, id: string, input: ActionApprovalRequestInput) {
  const { user, entityManager, logger } = this
  userInvariant(user)

  const repo = entityManager.getRepository(ApprovalRequestEntity)
  const approvalRequest = await repo.findOneByOrFail({ id })

  approvalRequest.action(input.isApproved, input.actionedComment)
  const approvedRequest = await repo.save(approvalRequest)

  const presentation = await approvedRequest.presentation
  const identity = (await presentation.identity)!
  // invoke the callback
  if (approvedRequest.callbackInput) {
    const data: ActionedApprovalData = {
      approvalRequestId: approvedRequest.id,
      correlationId: approvedRequest.correlationId,
      requestData: approvedRequest.requestData,
      state: approvedRequest.callbackInput.state,
      isApproved: input.isApproved,
      actionedComment: input.actionedComment,
      actionedAt: approvalRequest.updatedAt!,
      actionedBy: { id: identity.id, name: identity.name },
      callbackSecret: approvedRequest.callbackSecret,
    }

    const request: RequestInit = {
      method: 'POST',
      body: JSON.stringify(data),
      headers: approvedRequest.callbackInput.headers as { [key: string]: string } | undefined,
    }

    try {
      const response = await fetch(approvedRequest.callbackInput.url, request)

      if (response.ok) {
        logger.info('Actioned approval callback complete', {
          approvalRequestId: approvedRequest.id,
          responseStatus: response.status,
        })
      } else {
        const responseInfo = await extractErrorResponseInfo(response)
        logger.error(`Actioned approval callback returned non-200 response`, {
          approvalRequestId: approvedRequest.id,
          response: responseInfo,
        })
      }
    } catch (error) {
      logger.error(`Actioned approval callback failed`, { approvalRequestId: approvedRequest.id, error })
    }
  }

  return approvedRequest
}
