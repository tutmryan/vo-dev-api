import { getClientCredentialsToken } from '@makerx/node-common'
import { limitedAccessAuth } from '../../../config'
import type { CommandContext } from '../../../cqs'
import type { AcquireLimitedApprovalTokenInput, ApprovalTokenResponse } from '../../../generated/graphql'
import { ApprovalRequestStatus } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { ApprovalRequestEntity } from '../../approval-request/entities/approval-request-entity'
import { setLimitedApprovalData } from '../../limited-approval-tokens'

export async function AcquireLimitedApprovalTokenCommand(
  this: CommandContext,
  input: AcquireLimitedApprovalTokenInput,
): Promise<ApprovalTokenResponse> {
  invariant(input.approvalRequestId, 'Approval request ID is required')
  const { entityManager } = this

  const approvalRequest = await entityManager.getRepository(ApprovalRequestEntity).findOneByOrFail({ id: input.approvalRequestId })

  if (approvalRequest.status !== ApprovalRequestStatus.Pending) {
    throw new Error(`Approval request is at ${approvalRequest.status} and is no longer pending`)
  }

  const token = await getClientCredentialsToken(limitedAccessAuth)

  await setLimitedApprovalData(token.access_token, input)

  return {
    token: token.access_token,
    expires: token.expires,
  }
}
