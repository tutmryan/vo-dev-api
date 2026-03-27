import { AuditEvents } from '../../../audit-types'
import type { TransactionalCommandContext } from '../../../cqs'
import { CommunicationError } from '../../../services/communications-service'
import { userInvariant } from '../../../util/user-invariant'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'
import { sendPresentationFlowNotification } from '../notification'

export async function ResendPresentationFlowNotificationCommand(
  this: TransactionalCommandContext,
  presentationFlowId: string,
): Promise<PresentationFlowEntity> {
  const { services, user, inTransaction, logger } = this

  logger.mergeMeta({
    presentationFlowId,
  })

  userInvariant(user)

  try {
    return await inTransaction((entityManager) => {
      return sendPresentationFlowNotification({ services, logger }, entityManager, presentationFlowId)
    })
  } catch (error) {
    await inTransaction(async (entityManager) => {
      const repository = entityManager.getRepository(PresentationFlowEntity)
      const presentationFlow = await repository.findOneByOrFail({ id: presentationFlowId })
      presentationFlow.notificationFailed()
      await repository.save(presentationFlow)

      if (error instanceof CommunicationError) {
        await services.communications.recordPresentationFlowCommunicationFailure(error, entityManager)
      }

      logger.auditEvent(AuditEvents.PRESENTATION_FLOW_NOTIFICATION_RESEND_FAILED)
    })
    throw error
  }
}
