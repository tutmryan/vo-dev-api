import type { JobHandler, JobPayload } from '../../../background-jobs/jobs'
import type { JobType } from '../../../background-jobs/queue'
import { dataSource, ISOLATION_LEVEL } from '../../../data'
import { addUserToManager } from '../../auditing/user-context-helper'
import { sendAsyncIssuanceNotification } from '../notification'

export type SendAsyncIssuanceNotificationsJobName = 'sendAsyncIssuanceNotifications'
export type SendAsyncIssuanceNotificationsJobPayload = JobPayload & { asyncIssuanceRequestIds: string[] }
export type SendAsyncIssuanceNotificationsJobType = JobType<SendAsyncIssuanceNotificationsJobName, SendAsyncIssuanceNotificationsJobPayload>

export const sendAsyncIssuanceNotificationsJobHandler: JobHandler<SendAsyncIssuanceNotificationsJobPayload> = async (context, job) => {
  const errorMessages = []

  for (const [i, requestId] of job.data.asyncIssuanceRequestIds.entries()) {
    try {
      await dataSource.manager.transaction(ISOLATION_LEVEL, async (entityManager) => {
        addUserToManager(entityManager, job.data.userId)
        await sendAsyncIssuanceNotification(context, entityManager, requestId)
      })
    } catch (err: any) {
      errorMessages.push(`Error sending async issuance notification ${requestId}: ${'message' in err ? err.message : err}`)
      // error is already logged in sendAsyncIssuanceNotification
    } finally {
      await job.updateProgress(Math.floor(((i + 1) / job.data.asyncIssuanceRequestIds.length) * 100))
    }
  }

  if (errorMessages.length > 0) {
    throw new Error(errorMessages.join('\n'))
  }
}
