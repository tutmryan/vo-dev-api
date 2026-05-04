import { randomUUID } from 'crypto'
import { addDays } from 'date-fns'
import { AuditEvents } from '../../../audit-types'
import { addToJobQueue } from '../../../background-jobs'
import type { CommandContext } from '../../../cqs'
import { isMDocPresentationsEnabled, registerFeatureCheck } from '../../../cqs/feature-map'
import {
  DataType,
  PresentationFlowNotificationStatus,
  type DataDefinition,
  type MDocPresentationFlowInput,
} from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'

registerFeatureCheck(CreateMDocPresentationFlowCommand, async (...[,]) => isMDocPresentationsEnabled())

function buildDataSchemaFromClaims(requestedClaims: MDocPresentationFlowInput['mdocRequest']['requestedClaims']): DataDefinition[] {
  return requestedClaims.flatMap((claim) => {
    if (claim.path.length < 2) {
      return []
    }

    const namespace = claim.path[0]?.trim()
    const claimName = claim.path[1]?.trim()

    if (!namespace || !claimName) {
      return []
    }

    return [
      {
        id: `${namespace}/${claimName}`,
        type: DataType.Text,
        label: claimName,
        required: false,
      },
    ]
  })
}

export async function CreateMDocPresentationFlowCommand(
  this: CommandContext,
  input: MDocPresentationFlowInput,
): Promise<{ callbackSecret: string; request: PresentationFlowEntity }> {
  const { user, entityManager, logger, services } = this
  userInvariant(user)

  // Validate that at least one claim is requested
  invariant(input.mdocRequest.requestedClaims.length > 0, 'At least one claim must be requested')

  const expiresAt = input.expiresAt ?? addDays(Date.now(), 7)

  const entity = new PresentationFlowEntity()
  entity.type = 'mdoc'
  entity.expiresAt = expiresAt
  entity.title = input.title?.trim() || null
  entity.identityId = input.identityId ?? null
  entity.correlationId = input.correlationId ?? null
  entity.prePresentationText = input.prePresentationText ?? null
  entity.postPresentationText = input.postPresentationText ?? null
  entity.requestDataJson = null
  entity.presentationRequestJson = null
  entity.mdocRequestJson = JSON.stringify(input.mdocRequest)
  entity.dataSchemaJson = JSON.stringify(buildDataSchemaFromClaims(input.mdocRequest.requestedClaims))
  entity.dataResultsJson = null
  entity.actionsJson = null
  entity.autoSubmit = null
  entity.callbackJson = input.callback ? JSON.stringify(input.callback) : null
  entity.callbackSecret = randomUUID()
  entity.templateId = null
  entity.presentationId = null
  entity.isCancelled = null
  entity.isSubmitted = null
  entity.hasContactNotification = input.contact?.notification ? true : null
  entity.notificationStatus = input.contact?.notification ? PresentationFlowNotificationStatus.Pending : null

  const saved = await entityManager.getRepository(PresentationFlowEntity).save(entity)

  if (input.contact?.notification) {
    await services.presentationFlows.uploadContact(saved.id, input.contact)
    await addToJobQueue('sendPresentationFlowNotifications', {
      userId: user.entity.id,
      presentationFlowId: saved.id,
    })
  }

  logger.auditEvent(AuditEvents.MDOC_PRESENTATION_FLOW_CREATED, {
    presentationFlowId: saved.id,
    userId: user.entity.id,
    title: saved.title,
    identityId: saved.identityId,
    templateId: null,
  })

  return {
    callbackSecret: entity.callbackSecret,
    request: saved,
  }
}
