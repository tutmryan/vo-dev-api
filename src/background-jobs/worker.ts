import type { Job } from 'bullmq'
import { Worker } from 'bullmq'
import type { EntityManager } from 'typeorm'
import { runInTransaction } from '../data'
import { dataSource } from '../data/data-source'
import { SYSTEM_USER_ID, UserEntity } from '../features/users/entities/user-entity'
import { BackgroundJobStatus } from '../generated/graphql'
import { logger } from '../logger'
import { redisOptions } from '../redis'
import { createVerifiedIdAdminService } from '../services'
import { AsyncIssuanceService } from '../services/async-issuance-service'
import { CommunicationsService } from '../services/communications-service'
import { Lazy } from '../util/lazy'
import type { JobConfig } from './jobs'
import { getJobConfig, type HandlerContext, type JobPayload } from './jobs'
import { publishBackgroundJobEvent } from './pubsub'
import { defaultJobOptions, JobQueueName } from './queue'
import { publishScheduledJobResult } from './scheduler'

function jobLogMetadata({ job, user }: { job?: Job<JobPayload>; user?: UserEntity }) {
  return { job: job ? { name: job.name, id: job.id } : {}, user: user ? { id: user.id, name: user.name } : {} }
}

async function executeJob(job: Job<JobPayload>, jobConfig: JobConfig, entityManager: EntityManager, systemUserId: string) {
  const { name, data: payload } = job
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

  logger.verbose(`Running handler for job ${name} as ${context.user.name}`, logMetadata)
  try {
    const result = await jobConfig.handler(context, payload)
    logger.verbose(`Handler for job ${name} completed in ${Date.now() - started}ms`, logMetadata)
    return result
  } catch (error) {
    logger.error(`Handler for job ${name} failed after ${Date.now() - started}ms`, { error, ...logMetadata })
    // Exceptions thrown from a worker must be an `Error` for BullMQ to handle them correctly
    // https://docs.bullmq.io/guide/retrying-failing-jobs
    throw new Error(`Job ${name} failed`, { cause: error })
  }
}

export async function dispatchJobHandler(job: Job<JobPayload>) {
  const { name, data: payload } = job
  const jobConfig = getJobConfig(name)
  if (!jobConfig) throw new Error(`No job config found for: ${name}`)

  if (jobConfig.disableImplicitTransaction) {
    // If the job is configured to not use an implicit transaction, we can run the handler directly
    return await executeJob(job, jobConfig, dataSource.manager, SYSTEM_USER_ID)
  } else {
    // Otherwise, we run the handler in a transaction
    return await runInTransaction(payload.userId ?? SYSTEM_USER_ID, async (entityManager) => {
      return await executeJob(job, jobConfig, entityManager, SYSTEM_USER_ID)
    })
  }
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
