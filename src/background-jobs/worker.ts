import type { Job } from 'bullmq'
import { Worker } from 'bullmq'
import { dataSource } from '../data'
import { UserEntity } from '../features/users/entities/user-entity'
import { BackgroundJobStatus } from '../generated/graphql'
import { logger } from '../logger'
import { redisOptions } from '../redis'
import { createVerifiedIdAdminService } from '../services'
import { Lazy } from '../util/lazy'
import type { JobPayload } from './jobs'
import { handlers, type JobNames, type WorkerContext } from './jobs'
import { publishBackgroundJobEvent } from './pubsub'
import { JobQueueName, MAX_RETRY } from './queue'

type BackgroundJob = Job<JobPayload>

const createWorkerContext = async (userId: string): Promise<WorkerContext> => ({
  logger,
  verifiedIdAdminService: createVerifiedIdAdminService(logger),
  user: await dataSource.getRepository(UserEntity).findOneByOrFail({ id: userId }),
})

export const worker = Lazy(
  () =>
    new Worker(
      JobQueueName,
      async (job: BackgroundJob) => {
        const handler = handlers[job.name as JobNames]
        if (handler) {
          const context = await createWorkerContext(job.data.userId)
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
