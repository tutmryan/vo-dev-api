import type { Job } from 'bullmq'
import { Worker } from 'bullmq'
import { dataSource } from '../data'
import { UserEntity } from '../features/users/entities/user-entity'
import { BackgroundJobStatus } from '../generated/graphql'
import { logger } from '../logger'
import { redisOptions } from '../redis'
import { createVerifiedIdAdminService } from '../services'
import { AsyncIssuanceService } from '../services/async-issuance-service'
import { CommunicationsService } from '../services/communications-service'
import { Lazy } from '../util/lazy'
import type { JobPayload } from './jobs'
import { handlers, jobOptions, type JobNames, type WorkerContext } from './jobs'
import { publishBackgroundJobEvent } from './pubsub'
import { defaultJobOptions, JobQueueName } from './queue'

type BackgroundJob = Job<JobPayload>

export const createWorkerContext = async (userId?: string): Promise<WorkerContext> => ({
  logger,
  user: userId ? await dataSource.getRepository(UserEntity).findOneByOrFail({ id: userId }) : undefined,
  services: {
    verifiedIdAdmin: createVerifiedIdAdminService(logger),
    asyncIssuances: new AsyncIssuanceService(),
    communications: new CommunicationsService(logger),
  },
})

export const worker = Lazy(() => {
  const worker = new Worker(
    JobQueueName,
    async (job: BackgroundJob) => {
      const handler = handlers[job.name as JobNames]
      if (!handler) {
        logger.error(`No handler found for job: ${job.name}`)
        return
      }
      const started = Date.now()
      logger.info(`Running job handler: ${job.name}`)
      try {
        const context = await createWorkerContext(job.data?.userId)
        await handler(context, job)
        logger.info(`Job handler ${job.name} completed in ${Date.now() - started}ms`)
      } catch (error) {
        logger.error(`Job handler ${job.name} failed after ${Date.now() - started}ms`, { error })
        // Exceptions thrown from a worker must be an `Error` for BullMQ to handle them correctly
        // https://docs.bullmq.io/guide/retrying-failing-jobs
        throw new Error(`Job handler ${job.name} failed`)
      }
    },
    { concurrency: 2, connection: redisOptions },
  )

  worker.on('active', (job: BackgroundJob) => {
    publishBackgroundJobEvent({
      event: { status: BackgroundJobStatus.Active },
      jobId: job.id!,
      jobName: job.name,
      userId: job.data?.userId,
    })
    logger.info(`Job (id: ${job.id}) is active.`)
  })

  worker.on('progress', (job: BackgroundJob, progress) => {
    publishBackgroundJobEvent({
      event: { status: BackgroundJobStatus.Progress, progress: progress as number },
      jobId: job.id!,
      jobName: job.name,
      userId: job.data?.userId,
    })
    logger.info(`Job (id: ${job.id}) is in progress: ${progress}`, progress)
  })

  worker.on('completed', (job: BackgroundJob, result) => {
    publishBackgroundJobEvent({
      event: { status: BackgroundJobStatus.Completed, result: result },
      jobId: job.id!,
      jobName: job.name,
      userId: job.data?.userId,
    })
    logger.info(`Job (id: ${job.id}) is completed.`, result)
  })

  worker.on('failed', (job: BackgroundJob | undefined, error) => {
    const hasEncounteredUnrecoverableError = (j: BackgroundJob) => !!j.finishedOn
    const jobRetries = jobOptions[job?.name as JobNames]?.attempts ?? defaultJobOptions.attempts ?? 0
    const hasNoAttemptsLeft = (j: BackgroundJob) => j.attemptsMade >= jobRetries
    if (job) {
      publishBackgroundJobEvent({
        event: {
          status:
            hasNoAttemptsLeft(job) || hasEncounteredUnrecoverableError(job) ? BackgroundJobStatus.Failed : BackgroundJobStatus.Retrying,
          error: error.message,
        },
        jobId: job.id!,
        jobName: job.name,
        userId: job.data?.userId,
      })
    }
    logger.error(`Job (id: ${job?.id}) failed after attempt ${job?.attemptsMade}.`, error)
  })

  worker.on('error', (err) => {
    logger.error('Background worker failed', { err })
  })

  return worker
})
