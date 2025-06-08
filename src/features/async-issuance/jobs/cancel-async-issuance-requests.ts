import type { Job } from 'bullmq'
import { type FindOptionsWhere, In } from 'typeorm'
import type { JobHandler, JobPayload, WorkerContext } from '../../../background-jobs/jobs'
import type { JobType } from '../../../background-jobs/queue'
import { dataSource, ISOLATION_LEVEL } from '../../../data'
import { addUserToManager } from '../../../data/user-context-helper'
import { invariant } from '../../../util/invariant'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'
import { convertAsyncIssuanceExpiryDaysToRequestExpiry } from '../index'

export type CancelAsyncIssuanceRequestsJobName = 'cancelAsyncIssuanceRequests'
export type CancelAsyncIssuanceRequestsJobPayload = JobPayload & { asyncIssuanceRequestIds: string[] }
export type CancelAsyncIssuanceRequestsJobType = JobType<CancelAsyncIssuanceRequestsJobName, CancelAsyncIssuanceRequestsJobPayload>

export const cancelAsyncIssuanceRequestsHandler: JobHandler<CancelAsyncIssuanceRequestsJobPayload> = async (context, job) =>
  cancelAsyncIssuanceRequests(job, context, { id: In(job.data.asyncIssuanceRequestIds) })

const cancelAsyncIssuanceRequests = async (job: Job, context: WorkerContext, where: FindOptionsWhere<AsyncIssuanceEntity>) => {
  const errorMessages = []
  const {
    logger,
    user,
    services: { asyncIssuances },
  } = context
  invariant(user, 'User is required in worker context for cancelling async issuances')
  const requests = await dataSource.getRepository(AsyncIssuanceEntity).find({ where })

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i]!
    try {
      if (request.state === 'cancelled') {
        continue
      }
      if (!request.canCancel) {
        errorMessages.push(`Cannot cancel the async issuance request ${request.id} because its status is final`)
        continue
      }

      await dataSource.manager.transaction(ISOLATION_LEVEL, async (entityManager) => {
        addUserToManager(entityManager, user.id)
        await asyncIssuances.deleteAsyncIssuanceIfExists(
          request.id,
          convertAsyncIssuanceExpiryDaysToRequestExpiry(request.expiryPeriodInDays),
        )
        request.canceled()
        await entityManager.getRepository(AsyncIssuanceEntity).save(request)
      })
    } catch (err) {
      logger.error(`Error occurred when canceling the async issuance request ${request.id}`, err)
      errorMessages.push(`Error occurred when canceling the async issuance request ${request.id}: ${(err as Error).message}`)
    } finally {
      await job.updateProgress(Math.floor(((i + 1) / requests.length) * 100))
    }
  }

  if (errorMessages.length > 0) {
    throw new Error(errorMessages.join('\n'))
  }
}
