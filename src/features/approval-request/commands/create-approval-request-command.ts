import { addDays } from 'date-fns'
import { portalUrl } from '../../../config'
import type { CommandContext } from '../../../cqs'
import type { ApprovalRequestInput, ApprovalRequestResponse } from '../../../generated/graphql'
import { userInvariant } from '../../../util/user-invariant'
import { ApprovalRequestEntity } from '../entities/approval-request-entity'

export async function CreateApprovalRequestCommand(this: CommandContext, input: ApprovalRequestInput): Promise<ApprovalRequestResponse> {
  const { user, entityManager } = this

  userInvariant(user)

  const approvalRequest = new ApprovalRequestEntity({
    expiresAt: input.expiresAt ?? addDays(Date.now(), 7),
    requestType: input.requestType,
    correlationId: input.correlationId ?? null,
    referenceUrl: input.referenceUrl ?? null,
    purpose: input.purpose ?? null,
    presentationRequestJson: JSON.stringify(input.presentationRequestInput),
    requestDataJson: JSON.stringify(input.requestData),
    callbackJson: JSON.stringify(input.callback),
  })

  const newApprovalRequest = await entityManager.getRepository(ApprovalRequestEntity).save(approvalRequest)
  return {
    id: newApprovalRequest.id,
    portalUrl: `${portalUrl}/approval-request/${newApprovalRequest.id}`,
  }
}
