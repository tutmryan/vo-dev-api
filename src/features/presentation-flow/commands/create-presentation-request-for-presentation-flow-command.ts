import { AuditEvents } from '../../../audit-types'
import { portalUrl } from '../../../config'
import type { CommandContext } from '../../../cqs'
import type {
  CreatePresentationRequestForPresentationFlowInput,
  PresentationFlowRequestResponse,
  PresentationRequestInput,
} from '../../../generated/graphql'
import { PresentationFlowStatus } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { getLimitedPresentationFlowKey } from '../../limited-presentation-flow-tokens'
import { CreateMDocPresentationRequestCommand } from '../../presentation/commands/create-mdoc-presentation-request-command'
import { CreatePresentationRequestCommand } from '../../presentation/commands/create-presentation-request-command'
import { mdocRequestDetailsCache } from '../../presentation/mdoc/shared-config'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'
import { publishPresentationFlowEvent } from '../pubsub'

export async function CreatePresentationRequestForPresentationFlowCommand(
  this: CommandContext,
  presentationFlowId: string,
  input?: CreatePresentationRequestForPresentationFlowInput,
): Promise<PresentationFlowRequestResponse> {
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

  let result: PresentationFlowRequestResponse

  if (request.type === 'mdoc') {
    // Phase 2 (mDoc path): dispatch the mDoc presentation request command using stored config
    const mdocRequest = request.mdocRequest
    invariant(mdocRequest, 'mDoc presentation flow is missing mdocRequest configuration')

    // Always overwrite signing.expectedOrigins with the portal origin.
    // The ISO 18013-7 SessionTranscript (used in ReaderAuthentication and HPKE info) must be
    // built with the origin of the page that invokes navigator.credentials.get(), which is
    // always the portal/concierge. Any expectedOrigins persisted on the flow (e.g. from a
    // client that mistakenly injected its own origin) would cause the wallet to reject the
    // signed reader auth and fail to decrypt the response.
    const portalOrigin = new URL(portalUrl).origin
    const mdocRequestWithOrigin = {
      ...mdocRequest,
      signing: {
        ...(mdocRequest.signing ?? {}),
        expectedOrigins: [portalOrigin],
      },
    }

    result = await CreateMDocPresentationRequestCommand.apply(this, [mdocRequestWithOrigin])

    // Store the presentationFlowId in the mDoc request details cache so that
    // ProcessMDocPresentationResponseCommand can link the result back to this flow.
    const requestDetails = await mdocRequestDetailsCache().get(result.requestId)
    if (requestDetails) {
      await mdocRequestDetailsCache().set(result.requestId, { ...requestDetails, presentationFlowId })
    }
  } else {
    // Phase 2 (VC path): external call with no DB lock held, then a targeted write by PK
    const presentationRequest = request.presentationRequest
    invariant(presentationRequest, 'VC presentation flow is missing presentationRequest configuration')

    const presentationRequestInput: PresentationRequestInput = {
      ...presentationRequest,
      includeQRCode: input?.includeQRCode,
    }

    result = await CreatePresentationRequestCommand.apply(this, [
      presentationRequestInput,
      { limitedPresentationFlowKey: getLimitedPresentationFlowKey(user.token), presentationFlowId },
    ])
  }

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
