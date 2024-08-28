import type { CommandContext } from '../../../cqs'
import { ApprovalRequestStatus, type UpdateApprovalRequestInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { ApprovalRequestEntity } from '../entities/approval-request-entity'

export async function UpdateApprovalRequestCommand(this: CommandContext, id: string, input: UpdateApprovalRequestInput) {
  const { user, entityManager } = this

  userInvariant(user)

  const approvalRequest = await entityManager.getRepository(ApprovalRequestEntity).findOneBy({ id: id })
  invariant(approvalRequest, `Approval request for ${id} not found`)
  invariant(
    approvalRequest.status === ApprovalRequestStatus.Pending,
    `Approval request ${approvalRequest.id} is in a ${approvalRequest.status} state. Only pending requests can be updated.`,
  )

  invariant(
    approvalRequest.createdById.toLowerCase() === user.userEntity.id.toLowerCase(),
    `User does not have permission to update this approval request. Only the creator can update the request.`,
  )

  let isUpdated = false
  if (approvalRequest.purpose !== input.purpose) {
    approvalRequest.purpose = input.purpose
    isUpdated = true
  }
  if (approvalRequest.requestDataJson !== JSON.stringify(input.requestData)) {
    approvalRequest.requestDataJson = JSON.stringify(input.requestData)
    isUpdated = true
  }

  if (isUpdated) {
    await entityManager.getRepository(ApprovalRequestEntity).save(approvalRequest)
  }
}
