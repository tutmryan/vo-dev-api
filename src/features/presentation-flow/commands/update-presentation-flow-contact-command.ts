import { AuditEvents } from '../../../audit-types'
import type { CommandContext } from '../../../cqs'
import type { PresentationFlowContactInput } from '../../../generated/graphql'
import { PresentationFlowNotificationStatus } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'

export async function UpdatePresentationFlowContactCommand(
  this: CommandContext,
  presentationFlowId: string,
  contact?: PresentationFlowContactInput | null,
): Promise<PresentationFlowEntity> {
  userInvariant(this.user)
  this.logger.mergeMeta({
    presentationFlowId,
  })

  const repository = this.entityManager.getRepository(PresentationFlowEntity)
  const entity = await repository.findOneByOrFail({ id: presentationFlowId })

  // Check that the presentation flow is in a valid state for updating
  invariant(!entity.isCancelled, 'Cannot update contact for cancelled presentation flow')
  invariant(!entity.isSubmitted, 'Cannot update contact for submitted presentation flow')
  invariant(!entity.presentationId, 'Cannot update contact for completed presentation flow')

  if (contact?.notification) {
    await this.services.presentationFlows.uploadContact(presentationFlowId, contact)
    entity.hasContactNotification = true
    entity.notificationStatus = PresentationFlowNotificationStatus.Pending
  } else {
    await this.services.presentationFlows.deleteContactIfExists(presentationFlowId)
    entity.hasContactNotification = null
    entity.notificationStatus = null
  }

  await repository.save(entity)

  this.logger.auditEvent(AuditEvents.PRESENTATION_FLOW_CONTACT_UPDATED, {
    presentationFlowId,
  })

  return entity
}
