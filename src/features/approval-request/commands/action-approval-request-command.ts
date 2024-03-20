import type { CommandContext } from '../../../cqs'
import type { ActionApprovalRequestInput } from '../../../generated/graphql'
import { userInvariant } from '../../../util/user-invariant'
import { ApprovalRequestEntity } from '../entities/approval-request-entity'

export async function ActionApprovalRequestCommand(this: CommandContext, id: string, input: ActionApprovalRequestInput) {
  const { user, entityManager } = this
  userInvariant(user)

  const repo = entityManager.getRepository(ApprovalRequestEntity)
  const approvalRequest = await entityManager.getRepository(ApprovalRequestEntity).findOneByOrFail({ id })

  approvalRequest.action(input.isApproved, input.actionedComment)
  return await repo.save(approvalRequest)
}
