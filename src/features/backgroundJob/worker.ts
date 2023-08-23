import type { Job } from 'bullmq'
import { Worker } from 'bullmq'
import { dataSource } from '../../data'
import { BackgroundJobStatus } from '../../generated/graphql'
import { logger } from '../../logger'
import { redisOptions } from '../../redis'
import { createAdminService } from '../../services'
import type { AdminService } from '../../services/admin'
import { UserEntity } from '../users/entities/user-entity'
import { publishBackgroundJobEvent } from './pubsub'
import type { JobNames, JobTypes } from './queue'
import { JobQueueName, MAX_RETRY } from './queue'
import { revokeIssuancesJobHandler } from './revoke-issuances-job-handler'

type BackgroundJob = Omit<Job, 'data'> & { data: { correlationId?: string; userId: string } }
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
}

const createWorkerContext = async (userId: string, correlationId?: string): Promise<WorkerContext> => ({
  logger,
  adminService: createAdminService(logger, correlationId),
  user: await dataSource.getRepository(UserEntity).findOneByOrFail({ id: userId }),
})

let worker: Worker | null = null
export const getWorker = () =>
  worker ||
  (worker = new Worker(
    JobQueueName,
    async (job) => {
      const handler = handlers[job.name as JobNames]
      if (handler) {
        const context = await createWorkerContext(job.data.userId, job.data.correlationId)
        await handler(context, job)
      }
    },
    { concurrency: 10, connection: redisOptions },
  ))

getWorker().on('active', (job: BackgroundJob) => {
  publishBackgroundJobEvent({ event: { status: BackgroundJobStatus.Active }, jobId: job.id!, userId: job.data.userId })
  logger.info(`Job (id: ${job.id}) is active.`)
})

getWorker().on('progress', (job: BackgroundJob, progress) => {
  publishBackgroundJobEvent({
    event: { status: BackgroundJobStatus.Progress, progress: progress as number },
    jobId: job.id!,
    userId: job.data.userId,
  })
  logger.info(`Job (id: ${job.id}) is in progress: ${progress}`, progress)
})

getWorker().on('completed', (job: BackgroundJob, result) => {
  publishBackgroundJobEvent({
    event: { status: BackgroundJobStatus.Completed, result: result },
    jobId: job.id!,
    userId: job.data.userId,
  })
  logger.info(`Job (id: ${job.id}) is completed.`, result)
})

getWorker().on('failed', (job: BackgroundJob | undefined, error) => {
  if (job) {
    publishBackgroundJobEvent({
      event: {
        status: job.attemptsMade < MAX_RETRY ? BackgroundJobStatus.Retrying : BackgroundJobStatus.Failed,
        error: error.message,
      },
      jobId: job.id!,
      userId: job.data.userId,
    })
  }
  logger.error(`Job (id: ${job?.id}) failed after attempt ${job?.attemptsMade}.`, error)
})

getWorker().on('error', (err) => {
  logger.error('Background worker failed', { err })
})
