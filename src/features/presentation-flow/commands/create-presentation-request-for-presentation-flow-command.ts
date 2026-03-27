import { AuditEvents } from '../../../audit-types'
import type { CommandContext } from '../../../cqs'
import type {
  CreatePresentationRequestForPresentationFlowInput,
  PresentationRequestInput,
  PresentationRequestResponse,
} from '../../../generated/graphql'
import { PresentationFlowStatus } from '../../../generated/graphql'
import { userInvariant } from '../../../util/user-invariant'
import { getLimitedPresentationFlowKey } from '../../limited-presentation-flow-tokens'
import { CreatePresentationRequestCommand } from '../../presentation/commands/create-presentation-request-command'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'
import { publishPresentationFlowEvent } from '../pubsub'

export async function CreatePresentationRequestForPresentationFlowCommand(
  this: CommandContext,
  presentationFlowId: string,
  input?: CreatePresentationRequestForPresentationFlowInput,
): Promise<PresentationRequestResponse> {
  const { user, entityManager } = this
  userInvariant(user)

  // Phase 1: short read — validate status and extract the request input, then release the entity.
  // Keeping the entity in scope across the external call below would hold a DB connection open
  // for the duration of the HTTP round-trip, causing deadlocks with the concurrent callback
  // transaction that INSERTs into `presentation` and UPDATEs `presentation_flow`.
  const request = await entityManager.getRepository(PresentationFlowEntity).findOneOrFail({ where: { id: presentationFlowId } })

  const allowedStatuses: PresentationFlowStatus[] = [
    PresentationFlowStatus.Pending,
    PresentationFlowStatus.RequestCreated,
    PresentationFlowStatus.RequestRetrieved,
    PresentationFlowStatus.PresentationVerified,
  ]
  if (!allowedStatuses.includes(request.status)) {
    throw new Error(`Presentation flow is at ${request.status} and is no longer pending`)
  }

  const presentationRequestInput: PresentationRequestInput = {
    ...request.presentationRequest,
    includeQRCode: input?.includeQRCode,
  }

  // Phase 2: external call with no DB lock held, then a targeted write by PK.
  const result = await CreatePresentationRequestCommand.apply(this, [
    presentationRequestInput,
    { limitedPresentationFlowKey: getLimitedPresentationFlowKey(user.token), presentationFlowId },
  ])

  await entityManager.getRepository(PresentationFlowEntity).update(presentationFlowId, { isRequestCreated: true })
  await publishPresentationFlowEvent(presentationFlowId)

  // Log audit event for presentation request creation within flow context
  this.logger.auditEvent(AuditEvents.PRESENTATION_FLOW_REQUEST_CREATED, {
    presentationFlowId,
    presentationRequestId: 'requestId' in result ? result.requestId : undefined,
    userId: user.entity.id,
  })

  return result
}
