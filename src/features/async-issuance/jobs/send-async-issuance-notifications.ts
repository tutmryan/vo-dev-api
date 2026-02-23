import { AuditEvents } from '../../../audit-types'
import type { JobHandler } from '../../../background-jobs/jobs'
import { transactionOrReuse } from '../../../data'
import { addUserToManager } from '../../../data/user-context-helper'
import { CommunicationError } from '../../../services/communications-service'
import { isObject } from '../../../util/type-helpers'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'
import { sendAsyncIssuanceNotification } from '../notification'

export type SendAsyncIssuanceNotificationsJobPayload = { asyncIssuanceRequestIds: string[] }

export const sendAsyncIssuanceNotificationsJobHandler: JobHandler<SendAsyncIssuanceNotificationsJobPayload> = async (context, payload) => {
  const errorMessages = []
  const { logger } = context

  for (const [i, asyncIssuanceRequestId] of payload.asyncIssuanceRequestIds.entries()) {
    logger.mergeMeta({
      asyncIssuanceRequestId,
    })
    try {
      await transactionOrReuse(async (entityManager) => {
        addUserToManager(entityManager, context.user.id)
        await sendAsyncIssuanceNotification(context, entityManager, asyncIssuanceRequestId)
      })
    } catch (err: unknown) {
      await transactionOrReuse(async (entityManager) => {
        addUserToManager(entityManager, context.user.id)
        const repository = entityManager.getRepository(AsyncIssuanceEntity)
        const asyncIssuance = await repository.findOneByOrFail({ id: asyncIssuanceRequestId })
        asyncIssuance.failed('contact-failed')
        await repository.save(asyncIssuance)

        if (err instanceof CommunicationError) {
          await context.services.communications.recordCommunicationFailure(err, entityManager)
        }
        logger.auditEvent(AuditEvents.ASYNC_ISSUANCE_NOTIFICATION_JOB_FAILED)
      })

      errorMessages.push(
        `Error sending async issuance notification ${asyncIssuanceRequestId}: ${isObject(err) && 'message' in err ? err.message : err}`,
      )
      // error is already logged in sendAsyncIssuanceNotification
    } finally {
      await context.updateProgress(Math.floor(((i + 1) / payload.asyncIssuanceRequestIds.length) * 100))
    }
  }

  if (errorMessages.length > 0) {
    throw new Error(errorMessages.join('\n'))
  }
}
