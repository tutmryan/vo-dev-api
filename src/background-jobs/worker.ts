import type { Job } from 'bullmq'
import { Worker } from 'bullmq'
import { runInTransaction } from '../data'
import { resolveSystemUserId, UserEntity } from '../features/users/entities/user-entity'
import { BackgroundJobStatus } from '../generated/graphql'
import { logger } from '../logger'
import { redisOptions } from '../redis'
import { createVerifiedIdAdminService } from '../services'
import { AsyncIssuanceService } from '../services/async-issuance-service'
import { CommunicationsService } from '../services/communications-service'
import { Lazy } from '../util/lazy'
import { getJobConfig, type HandlerContext, type JobPayload } from './jobs'
import { publishBackgroundJobEvent } from './pubsub'
import { defaultJobOptions, JobQueueName } from './queue'
import { publishScheduledJobResult } from './scheduler'

function jobLogMetadata({ job, user }: { job?: Job<JobPayload>; user?: UserEntity }) {
  return { job: job ? { name: job.name, id: job.id } : {}, user: user ? { id: user.id, name: user.name } : {} }
}

export async function dispatchJobHandler(job: Job<JobPayload>) {
  const { name, data: payload } = job
  const jobConfig = getJobConfig(name)
  if (!jobConfig) throw new Error(`No job config found for: ${name}`)

  const systemUserId = await resolveSystemUserId()

  return await runInTransaction(payload.userId ?? systemUserId, async (entityManager) => {
    const { userId, requestInfo } = payload
    const context: HandlerContext = {
      logger,
      entityManager,
      user: await entityManager.getRepository(UserEntity).findOneByOrFail({ id: userId ?? systemUserId }),
      requestInfo,
      updateProgress: async (progress) => job.updateProgress(progress),
      jobAuditMetadata: { jobId: job.id!, jobData: job.data },
      services: {
        verifiedIdAdmin: createVerifiedIdAdminService(logger),
        asyncIssuances: new AsyncIssuanceService(),
        communications: new CommunicationsService(logger),
      },
    }

    const started = Date.now()
    const logMetadata = jobLogMetadata({ job, user: context.user })

    logger.info(`Running handler for job ${name} as ${context.user.name}`, logMetadata)
    try {
      const result = await jobConfig.handler(context, payload)
      logger.info(`Handler for job ${name} completed in ${Date.now() - started}ms`, logMetadata)
      return result
    } catch (error) {
      logger.error(`Handler for job ${name} failed after ${Date.now() - started}ms`, { error, ...logMetadata })
      // Exceptions thrown from a worker must be an `Error` for BullMQ to handle them correctly
      // https://docs.bullmq.io/guide/retrying-failing-jobs
      throw new Error(`Job ${name} failed`, { cause: error })
    }
  })
}

export const worker = Lazy(() => {
  const worker = new Worker(JobQueueName, async (job: Job<JobPayload>) => dispatchJobHandler(job), {
    concurrency: 2,
    connection: redisOptions,
  })

  worker.on('active', (job: Job<JobPayload>) => {
    publishBackgroundJobEvent({
      event: { status: BackgroundJobStatus.Active },
      jobId: job.id!,
      jobName: job.name,
      userId: job.data.userId,
    })
  })

  worker.on('progress', (job: Job<JobPayload>, progress) => {
    publishBackgroundJobEvent({
      event: { status: BackgroundJobStatus.Progress, progress: progress as number },
      jobId: job.id!,
      jobName: job.name,
      userId: job.data.userId,
    })
  })

  worker.on('completed', (job: Job<JobPayload>, result) => {
    publishBackgroundJobEvent({
      event: { status: BackgroundJobStatus.Completed, result: result as Record<string, unknown> },
      jobId: job.id!,
      jobName: job.name,
      userId: job.data.userId,
    })

    // schedule job IDs are prefixed with 'repeat:'
    if (job.id?.startsWith('repeat:')) publishScheduledJobResult({ jobName: job.name, result })
  })

  worker.on('failed', (job: Job<JobPayload> | undefined, error) => {
    const hasEncounteredUnrecoverableError = (j: Job<JobPayload>) => !!j.finishedOn
    const jobRetries = getJobConfig(job?.name ?? '')?.options?.attempts ?? defaultJobOptions.attempts ?? 0
    const hasNoAttemptsLeft = (j: Job<JobPayload>) => j.attemptsMade >= jobRetries
    if (job) {
      publishBackgroundJobEvent({
        event: {
          status:
            hasNoAttemptsLeft(job) || hasEncounteredUnrecoverableError(job) ? BackgroundJobStatus.Failed : BackgroundJobStatus.Retrying,
          error: error.message,
        },
        jobId: job.id!,
        jobName: job.name,
        userId: job.data.userId,
      })
    }
    logger.error(`Job ${job?.id} failed after attempt ${job?.attemptsMade}`, { error, ...jobLogMetadata({ job }) })
  })

  worker.on('error', (error) => {
    logger.error('Background worker failed', { error })
  })

  return worker
})
