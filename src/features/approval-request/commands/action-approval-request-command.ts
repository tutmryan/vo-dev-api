import { IsNull } from 'typeorm'
import { addToJobQueue } from '../../../background-jobs/queue'
import type { CommandContext } from '../../../cqs'
import type { ActionApprovalRequestInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { getLimitedApprovalData } from '../../limited-approval-tokens'
import { ApprovalRequestEntity } from '../entities/approval-request-entity'

export async function ActionApprovalRequestCommand(this: CommandContext, id: string, input: ActionApprovalRequestInput) {
  const { user, entityManager } = this
  userInvariant(user)

  const repo = entityManager.getRepository(ApprovalRequestEntity)
  const approvalRequest = await repo.findOneByOrFail({ id })

  const approvalData = await getLimitedApprovalData(user.token)
  invariant(approvalData.presentationId, 'This approval request does not have an associated presentation')

  // special update handling to avoid overwriting an already-actioned approval request
  const updatedPartial = approvalRequest.action(approvalData.presentationId, input.isApproved, input.actionedComment)
  const updateResult = await repo.update({ id, isApproved: IsNull() }, updatedPartial)
  invariant(updateResult.affected === 1, 'Approval request has already been actioned')

  const approvedRequest = await repo.findOneByOrFail({ id })
  if (approvedRequest.callbackInput)
    await addToJobQueue({ name: 'invokeApprovalCallback', payload: { userId: user.userEntity.id, approvedRequestId: approvedRequest.id } })

  return approvedRequest
}
