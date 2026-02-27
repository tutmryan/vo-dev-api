import { AuditEvents } from '../../../audit-types'
import type { CommandContext } from '../../../cqs'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { PresentationFlowTemplateEntity } from '../entities/presentation-flow-template-entity'

export async function DeletePresentationFlowTemplateCommand(this: CommandContext, id: string): Promise<void> {
  const { user, entityManager, logger } = this
  userInvariant(user)

  const repo = entityManager.getRepository(PresentationFlowTemplateEntity)
  const entity = await repo.findOneBy({ id, isDeleted: false })
  invariant(entity, `Template not found: ${id}`)

  entity.isDeleted = true
  await repo.save(entity)

  logger.auditEvent(AuditEvents.PRESENTATION_FLOW_TEMPLATE_DELETED, {
    templateId: entity.id,
    userId: user.entity.id,
    name: entity.name,
  })
}
