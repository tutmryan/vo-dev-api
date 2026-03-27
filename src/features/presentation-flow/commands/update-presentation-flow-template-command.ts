import { randomUUID } from 'crypto'
import { AuditEvents } from '../../../audit-types'
import type { CommandContext } from '../../../cqs'
import type { PresentationFlowTemplateInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { defaultTemplateNotification, PresentationFlowTemplateEntity } from '../entities/presentation-flow-template-entity'

export async function UpdatePresentationFlowTemplateCommand(
  this: CommandContext,
  id: string,
  input: PresentationFlowTemplateInput,
): Promise<PresentationFlowTemplateEntity> {
  const { user, entityManager, logger } = this
  userInvariant(user)

  const repo = entityManager.getRepository(PresentationFlowTemplateEntity)
  const entity = await repo.findOneBy({ id, isDeleted: false })
  invariant(entity, `Template not found: ${id}`)

  entity.name = input.name.trim()
  entity.title = input.title?.trim() || null
  entity.prePresentationText = input.prePresentationText ?? null
  entity.postPresentationText = input.postPresentationText ?? null
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
  if (input.actions) {
    const actionKeys = input.actions.map((a) => a.key)
    invariant(new Set(actionKeys).size === actionKeys.length, 'Action keys must be unique')
  }
  entity.actionsJson = input.actions ? JSON.stringify(input.actions) : null
  entity.autoSubmit = input.autoSubmit ?? null
  entity.expiresAfterDays = input.expiresAfterDays ?? null
  entity.fieldVisibilityJson = JSON.stringify(input.fieldVisibility)
  entity.notificationJson = JSON.stringify(input.notification ?? defaultTemplateNotification)

  const saved = await repo.save(entity)

  logger.auditEvent(AuditEvents.PRESENTATION_FLOW_TEMPLATE_UPDATED, {
    templateId: saved.id,
    userId: user.entity.id,
    name: saved.name,
    title: saved.title,
  })

  return saved
}
