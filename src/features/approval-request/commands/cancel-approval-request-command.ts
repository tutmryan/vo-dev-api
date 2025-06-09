import { addToJobQueue } from '../../../background-jobs'
import type { CommandContext } from '../../../cqs'
import { ApprovalRequestStatus } from '../../../generated/graphql'
import { UserRoles } from '../../../roles'
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

  // admins can cancel any request, otherwise only the creator can cancel
  const isPermittedToCancel = user.roles.includes(UserRoles.approvalRequestAdmin) || approvalRequest.createdById === user.entity.id
  invariant(
    isPermittedToCancel,
    `User does not have permission to cancel this approval request. Only the creator of the request or an admin can cancel it.`,
  )

  approvalRequest.isCancelled = true

  await entityManager.getRepository(ApprovalRequestEntity).save(approvalRequest)

  if (approvalRequest.callbackInput)
    await addToJobQueue('invokeApprovalCallback', { userId: user.entity.id, approvedRequestId: approvalRequest.id })
}
