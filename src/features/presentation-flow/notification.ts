import { AuditEvents } from '../../audit-types'
import type { HandlerContext } from '../../background-jobs/jobs'
import { portalUrl } from '../../config'
import type { VerifiedOrchestrationEntityManager } from '../../data/entity-manager'
import { ContactMethod } from '../../generated/graphql'
import type { PresentationFlowCommunicationData } from '../../services/communications-service'
import { invariant } from '../../util/invariant'
import { PresentationFlowEntity } from './entities/presentation-flow-entity'

/**
 * Sends a presentation flow notification to the recipient and updates the notification status.
 */
export async function sendPresentationFlowNotification(
  { services: { communications, presentationFlows }, logger }: Pick<HandlerContext, 'services' | 'logger'>,
  entityManager: VerifiedOrchestrationEntityManager,
  presentationFlowId: string,
): Promise<PresentationFlowEntity> {
  logger.mergeMeta({ presentationFlowId })

  const repo = entityManager.getRepository(PresentationFlowEntity)
  const entity = await repo.findOneOrFail({
    where: { id: presentationFlowId },
    relations: { identity: true },
  })

  invariant(!entity.isCancelled, 'Cannot send notification for cancelled presentation flow')
  invariant(!entity.isSubmitted, 'Cannot send notification for submitted presentation flow')
  invariant(!entity.presentationId, 'Cannot send notification for completed presentation flow')
  invariant(entity.identityId, 'Cannot send notification without identity')

  const contact = await presentationFlows.downloadContact(presentationFlowId)
  invariant(contact?.notification, 'No contact information set for this presentation flow')
  const notificationContact = contact.notification

  const requestor = entity.presentationRequest.registration.clientName
  invariant(requestor, 'Cannot send notification without requestor name')
  const presentationFlowUrl = `${portalUrl}/presentation-flow/${presentationFlowId}`
  const identity = await entity.identity
  const identityName = identity?.name
  invariant(identityName, 'Cannot send notification without identity name')

  const data: PresentationFlowCommunicationData = {
    contactMethod: notificationContact.method,
    recipientId: entity.identityId,
    createdById: entity.createdById,
    presentationFlowId,
    presentationFlowUrl,
    title: entity.title || 'Presentation request',
    requestor,
    identityName,
  }

  await communications.sendPresentationFlow(notificationContact.value, data, entityManager)

  entity.notificationSent()
  await repo.save(entity)

  const auditEvent =
    notificationContact.method === ContactMethod.Email
      ? AuditEvents.PRESENTATION_FLOW_NOTIFICATION_EMAIL_SENT
      : AuditEvents.PRESENTATION_FLOW_NOTIFICATION_SMS_SENT
  logger.auditEvent(auditEvent, data)

  return entity
}
