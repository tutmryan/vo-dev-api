import type { CommandContext } from '../../../cqs'
import type { ApprovalRequestInput } from '../../../generated/graphql'
import { userInvariant } from '../../../util/user-invariant'
import { ApprovalRequestEntity } from '../entities/approval-request-entity'

export async function CreateApprovalRequestCommand(this: CommandContext, input: ApprovalRequestInput) {
  const { user, entityManager } = this

  userInvariant(user)

  const approvalRequest = new ApprovalRequestEntity({
    expiresAt: input.expiresAt,
    requestType: input.requestType,
    correlationId: input.correlationId ?? null,
    referenceUrl: input.referenceUrl ?? null,
    purpose: input.purpose ?? null,
    presentationRequestJson: JSON.stringify(input.presentationRequestInput),
    requestDataJson: JSON.stringify(input.requestData),
    callbackJson: JSON.stringify(input.callback),
  })

  return await entityManager.getRepository(ApprovalRequestEntity).save(approvalRequest)
}
