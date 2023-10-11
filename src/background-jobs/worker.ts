import type { Job } from 'bullmq'
import { Worker } from 'bullmq'
import { dataSource } from '../data'
import type { RevokeContractIssuancesJobName, RevokeContractIssuancesJobType } from '../features/issuance/jobs/revoke-contract-issuances'
import { revokeContractIssuancesJobHandler } from '../features/issuance/jobs/revoke-contract-issuances'
import type { RevokeIdentityIssuancesJobName, RevokeIdentityIssuancesJobType } from '../features/issuance/jobs/revoke-identity-issuances'
import { revokeIdentityIssuancesJobHandler } from '../features/issuance/jobs/revoke-identity-issuances'
import type { RevokeIssuancesJobName, RevokeIssuancesJobType } from '../features/issuance/jobs/revoke-issuances'
import { revokeIssuancesJobHandler } from '../features/issuance/jobs/revoke-issuances'
import {
  revokeUserIssuancesJobHandler,
  type RevokeUserIssuancesJobName,
  type RevokeUserIssuancesJobType,
} from '../features/issuance/jobs/revoke-user-issuances'
import { UserEntity } from '../features/users/entities/user-entity'
import { BackgroundJobStatus } from '../generated/graphql'
import { logger } from '../logger'
import { redisOptions } from '../redis'
import { createAdminService } from '../services'
import type { AdminService } from '../services/admin'
import { Lazy } from '../util/lazy'
import { publishBackgroundJobEvent } from './pubsub'
import { JobQueueName, MAX_RETRY } from './queue'

export type JobNames = RevokeIssuancesJobName | RevokeContractIssuancesJobName | RevokeIdentityIssuancesJobName | RevokeUserIssuancesJobName
export type JobTypes = RevokeIssuancesJobType | RevokeContractIssuancesJobType | RevokeIdentityIssuancesJobType | RevokeUserIssuancesJobType

type BackgroundJob = Job<{ correlationId?: string; userId?: string }>
export type WorkerContext = {
  logger: typeof logger
  adminService: AdminService
  user: UserEntity
}
type HandlerMap<T extends { name: JobNames }> = {
  [J in T as J['name']]?: (context: WorkerContext, job: Job) => Promise<void>
}

const handlers: HandlerMap<JobTypes> = {
  revokeIssuances: revokeIssuancesJobHandler,
  revokeContractIssuances: revokeContractIssuancesJobHandler,
  revokeIdentityIssuances: revokeIdentityIssuancesJobHandler,
  revokeUserIssuances: revokeUserIssuancesJobHandler,
}

const createWorkerContext = async (userId: string, correlationId?: string): Promise<WorkerContext> => ({
  logger,
  adminService: createAdminService(logger, correlationId),
  user: await dataSource.getRepository(UserEntity).findOneByOrFail({ id: userId }),
})

export const worker = Lazy(
  () =>
    new Worker(
      JobQueueName,
      async (job) => {
        const handler = handlers[job.name as JobNames]
        if (handler) {
          const context = await createWorkerContext(job.data.userId, job.data.correlationId)
          await handler(context, job)
        }
      },
      { concurrency: 2, connection: redisOptions },
    ),
)

worker().on('active', (job: BackgroundJob) => {
  publishBackgroundJobEvent({ event: { status: BackgroundJobStatus.Active }, jobId: job.id!, jobName: job.name, userId: job.data.userId })
  logger.info(`Job (id: ${job.id}) is active.`)
})

worker().on('progress', (job: BackgroundJob, progress) => {
  publishBackgroundJobEvent({
    event: { status: BackgroundJobStatus.Progress, progress: progress as number },
    jobId: job.id!,
    jobName: job.name,
    userId: job.data.userId,
  })
  logger.info(`Job (id: ${job.id}) is in progress: ${progress}`, progress)
})

worker().on('completed', (job: BackgroundJob, result) => {
  publishBackgroundJobEvent({
    event: { status: BackgroundJobStatus.Completed, result: result },
    jobId: job.id!,
    jobName: job.name,
    userId: job.data.userId,
  })
  logger.info(`Job (id: ${job.id}) is completed.`, result)
})

worker().on('failed', (job: BackgroundJob | undefined, error) => {
  const hasEncounteredUnrecoverableError = (j: BackgroundJob) => !!j.finishedOn
  const hasNoAttemptsLeft = (j: BackgroundJob) => j.attemptsMade >= MAX_RETRY
  if (job) {
    publishBackgroundJobEvent({
      event: {
        status: hasNoAttemptsLeft(job) || hasEncounteredUnrecoverableError(job) ? BackgroundJobStatus.Failed : BackgroundJobStatus.Retrying,
        error: error.message,
      },
      jobId: job.id!,
      jobName: job.name,
      userId: job.data.userId,
    })
  }
  logger.error(`Job (id: ${job?.id}) failed after attempt ${job?.attemptsMade}.`, error)
})

worker().on('error', (err) => {
  logger.error('Background worker failed', { err })
})
