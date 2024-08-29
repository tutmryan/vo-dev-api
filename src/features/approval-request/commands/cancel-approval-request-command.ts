import type { CommandContext } from '../../../cqs'
import { ApprovalRequestStatus } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { ApprovalRequestEntity } from '../entities/approval-request-entity'

export async function CancelApprovalRequestCommand(this: CommandContext, id: string) {
  const { user, entityManager } = this

  userInvariant(user)

  const approvalRequest = await entityManager.getRepository(ApprovalRequestEntity).findOneBy({ id: id })
  invariant(approvalRequest, `Approval request for ${id} not found`)
  invariant(
    approvalRequest.status === ApprovalRequestStatus.Pending,
    `Approval request ${approvalRequest.id} is in a ${approvalRequest.status} state. Only pending requests can be cancelled.`,
  )

  invariant(
    approvalRequest.createdById.toLowerCase() === user.userEntity.id.toLowerCase(),
    `User does not have permission to cancel this approval request. Only the creator can cancel the request.`,
  )

  approvalRequest.isCancelled = true

  await entityManager.getRepository(ApprovalRequestEntity).save(approvalRequest)
}
