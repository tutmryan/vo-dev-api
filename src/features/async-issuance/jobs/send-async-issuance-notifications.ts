import type { JobHandler, JobPayload } from '../../../background-jobs/jobs'
import type { JobType } from '../../../background-jobs/queue'
import { dataSource, ISOLATION_LEVEL } from '../../../data'
import { CommunicationError } from '../../../services/communications-service'
import { isObject } from '../../../util/type-helpers'
import { addUserToManager } from '../../auditing/user-context-helper'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'
import { sendAsyncIssuanceNotification } from '../notification'

export type SendAsyncIssuanceNotificationsJobName = 'sendAsyncIssuanceNotifications'
export type SendAsyncIssuanceNotificationsJobPayload = JobPayload & { asyncIssuanceRequestIds: string[] }
export type SendAsyncIssuanceNotificationsJobType = JobType<SendAsyncIssuanceNotificationsJobName, SendAsyncIssuanceNotificationsJobPayload>

export const sendAsyncIssuanceNotificationsJobHandler: JobHandler<SendAsyncIssuanceNotificationsJobPayload> = async (context, job) => {
  const errorMessages = []

  for (const [i, asyncIssuanceRequestId] of job.data.asyncIssuanceRequestIds.entries()) {
    try {
      await dataSource.manager.transaction(ISOLATION_LEVEL, async (entityManager) => {
        addUserToManager(entityManager, job.data.userId)
        await sendAsyncIssuanceNotification(context, entityManager, asyncIssuanceRequestId)
      })
    } catch (err: unknown) {
      await dataSource.manager.transaction(ISOLATION_LEVEL, async (entityManager) => {
        const repository = entityManager.getRepository(AsyncIssuanceEntity)
        const asyncIssuance = await repository.findOneByOrFail({ id: asyncIssuanceRequestId })
        asyncIssuance.failed('contact-failed')
        await repository.save(asyncIssuance)

        if (err instanceof CommunicationError) {
          await context.services.communications.recordCommunicationFailure(err, entityManager)
        }
      })

      errorMessages.push(
        `Error sending async issuance notification ${asyncIssuanceRequestId}: ${isObject(err) && 'message' in err ? err.message : err}`,
      )
      // error is already logged in sendAsyncIssuanceNotification
    } finally {
      await job.updateProgress(Math.floor(((i + 1) / job.data.asyncIssuanceRequestIds.length) * 100))
    }
  }

  if (errorMessages.length > 0) {
    throw new Error(errorMessages.join('\n'))
  }
}
