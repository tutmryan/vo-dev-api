import { AuditEvents } from '../../../audit-types'
import type { JobHandler } from '../../../background-jobs/jobs'
import { transactionOrReuse } from '../../../data'
import { addUserToManager } from '../../../data/user-context-helper'
import { CommunicationError } from '../../../services/communications-service'
import { isObject } from '../../../util/type-helpers'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'
import { sendPresentationFlowNotification } from '../notification'

export type SendPresentationFlowNotificationsJobPayload = {
  presentationFlowId: string
}

export const sendPresentationFlowNotificationsJobHandler: JobHandler<SendPresentationFlowNotificationsJobPayload> = async (
  context,
  payload,
) => {
  const { logger } = context
  const { presentationFlowId } = payload

  logger.mergeMeta({ presentationFlowId })

  try {
    await transactionOrReuse(async (entityManager) => {
      addUserToManager(entityManager, context.user.id)
      await sendPresentationFlowNotification(context, entityManager, presentationFlowId)
    })
  } catch (err: unknown) {
    await transactionOrReuse(async (entityManager) => {
      addUserToManager(entityManager, context.user.id)

      const repository = entityManager.getRepository(PresentationFlowEntity)
      const entity = await repository.findOneByOrFail({ id: presentationFlowId })
      entity.notificationFailed()
      await repository.save(entity)

      if (err instanceof CommunicationError) {
        await context.services.communications.recordPresentationFlowCommunicationFailure(err, entityManager)
      }

      logger.auditEvent(AuditEvents.PRESENTATION_FLOW_NOTIFICATION_JOB_FAILED, {
        presentationFlowId,
        error: isObject(err) && 'message' in err ? err.message : String(err),
      })
    })

    throw err
  }
}
