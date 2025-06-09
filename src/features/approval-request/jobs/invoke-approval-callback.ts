import { extractErrorResponseInfo } from '@makerx/node-common'
import { UnrecoverableError } from 'bullmq'
import type { JobHandler } from '../../../background-jobs/jobs'
import { dataSource } from '../../../data'
import type { ActionedApprovalData } from '../../../generated/graphql'
import { logger } from '../../../logger'
import { ApprovalRequestEntity } from '../entities/approval-request-entity'

export type InvokeApprovalCallbackJobPayload = { approvedRequestId: string }

export const invokeApprovalCallbackJobHandler: JobHandler<InvokeApprovalCallbackJobPayload> = async (_context, payload) => {
  const actionedApprovalRequest = await dataSource
    .getRepository(ApprovalRequestEntity)
    .findOneOrFail({ where: { id: payload.approvedRequestId }, relations: { presentation: { identity: true } } })

  if (!actionedApprovalRequest.callbackInput) throw new UnrecoverableError('Approval request does not have callback input')

  const presentation = await actionedApprovalRequest.presentation
  const identity = await presentation?.identity

  const data: ActionedApprovalData = {
    approvalRequestId: actionedApprovalRequest.id,
    correlationId: actionedApprovalRequest.correlationId,
    requestData: actionedApprovalRequest.requestData,
    state: actionedApprovalRequest.callbackInput.state,
    status: actionedApprovalRequest.status,
    actionedComment: actionedApprovalRequest.actionedComment,
    actionedAt: actionedApprovalRequest.updatedAt!,
    actionedBy: identity ? { id: identity.id, name: identity.name } : null,
    callbackSecret: actionedApprovalRequest.callbackSecret,
  }

  const request: RequestInit = {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { ['Content-Type']: 'application/json', ...actionedApprovalRequest.callbackInput.headers } as HeadersInit,
  }

  try {
    const response = await fetch(actionedApprovalRequest.callbackInput.url, request)

    if (response.ok) {
      logger.info('Actioned approval callback complete', {
        approvalRequestId: actionedApprovalRequest.id,
        responseStatus: response.status,
      })
    } else {
      const responseInfo = await extractErrorResponseInfo(response)
      const error = new Error(`Actioned approval callback returned non-200 response: ${response.status}`)
      logger.error(error.message, {
        approvalRequestId: actionedApprovalRequest.id,
        responseInfo,
      })
      throw error
    }
  } catch (error) {
    logger.error(`Actioned approval callback failed`, { approvalRequestId: actionedApprovalRequest.id, error })
    throw error
  }
}
