import { randomUUID } from 'crypto'
import { addDays } from 'date-fns'
import { AuditEvents } from '../../../audit-types'
import { addToJobQueue } from '../../../background-jobs'
import type { CommandContext } from '../../../cqs'
import { PresentationFlowNotificationStatus, type PresentationFlowInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'

export async function CreatePresentationFlowCommand(
  this: CommandContext,
  input: PresentationFlowInput,
): Promise<{ callbackSecret: string; request: PresentationFlowEntity }> {
  const { user, entityManager, logger, services } = this
  userInvariant(user)

  const expiresAt = input.expiresAt ?? addDays(Date.now(), 7)

  const entity = new PresentationFlowEntity()
  entity.type = 'vc'
  entity.expiresAt = expiresAt
  entity.title = input.title?.trim() || null
  entity.identityId = input.identityId ?? null
  entity.correlationId = input.correlationId ?? null
  entity.prePresentationText = input.prePresentationText ?? null
  entity.postPresentationText = input.postPresentationText ?? null
  entity.requestDataJson = input.requestData ? JSON.stringify(input.requestData) : null
  entity.presentationRequestJson = JSON.stringify(input.presentationRequest)
  entity.dataSchemaJson = input.dataSchema
    ? JSON.stringify(
        input.dataSchema.map((field) => ({
          ...field,
          id: randomUUID(),
          options: field.options?.map((option) => ({ ...option, id: randomUUID() })),
        })),
      )
    : null
  entity.dataResultsJson = null
  if (input.actions) {
    const actionKeys = input.actions.map((a) => a.key)
    invariant(new Set(actionKeys).size === actionKeys.length, 'Action keys must be unique')
  }
  entity.actionsJson = input.actions ? JSON.stringify(input.actions) : null
  entity.autoSubmit = input.autoSubmit ?? null
  entity.callbackJson = input.callback ? JSON.stringify(input.callback) : null
  entity.callbackSecret = randomUUID()
  entity.templateId = input.templateId ?? null
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

  logger.auditEvent(AuditEvents.PRESENTATION_FLOW_CREATED, {
    presentationFlowId: saved.id,
    userId: user.entity.id,
    title: saved.title,
    identityId: saved.identityId,
    templateId: saved.templateId,
  })

  return {
    callbackSecret: entity.callbackSecret,
    request: saved,
  }
}
