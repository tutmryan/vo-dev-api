import { type CommandContext } from '../../../cqs'
import type {
  CreatePresentationRequestForApprovalInput,
  PresentationRequestInput,
  PresentationRequestResponse,
} from '../../../generated/graphql'
import { ApprovalRequestStatus } from '../../../generated/graphql'
import { userInvariant } from '../../../util/user-invariant'
import { getLimitedApprovalKey } from '../../limited-approval-tokens'
import { CreatePresentationRequestCommand } from '../../presentation/commands/create-presentation-request-command'
import { ApprovalRequestEntity } from '../entities/approval-request-entity'

export async function CreatePresentationRequestForApprovalCommand(
  this: CommandContext,
  approvalRequestId: string,
  input?: CreatePresentationRequestForApprovalInput,
): Promise<PresentationRequestResponse> {
  const { user, entityManager } = this

  userInvariant(user)
  const approvalRequest = await entityManager.getRepository(ApprovalRequestEntity).findOneOrFail({ where: { id: approvalRequestId } })

  if (approvalRequest.status !== ApprovalRequestStatus.Pending) {
    throw new Error(`Approval request is at ${approvalRequest.status} and is no longer pending`)
  }

  const presentationRequestInput: PresentationRequestInput = {
    ...approvalRequest.presentationRequestInput,
    includeQRCode: input?.includeQRCode,
    registration: {
      clientName: 'Verified Orchestration Approvals',
    },
  }

  return await CreatePresentationRequestCommand.apply(this, [presentationRequestInput, getLimitedApprovalKey(user.token)])
}
