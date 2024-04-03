import { Queue, QueueEvents } from 'bullmq'
import { randomUUID } from 'crypto'
import { logger } from '../logger'
import { redisOptions } from '../redis'
import { Lazy } from '../util/lazy'
import type { JobTypes } from './jobs'
import { jobOptions } from './jobs'

export const JobQueueName = 'jobQueue'
export const MAX_RETRY = 3
export type JobType<TName extends string, TPayload extends { userId: string; requestId?: string }> = {
  name: TName
  payload: TPayload
}

export const jobQueue = Lazy(
  () =>
    new Queue(JobQueueName, {
      connection: redisOptions,
      defaultJobOptions: {
        attempts: MAX_RETRY,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
)

export const jobQueueEvents = Lazy(() => {
  const events = new QueueEvents(JobQueueName, { connection: redisOptions })
  events.on('paused', () => {
    logger.info(`${JobQueueName} has been paused`)
  })

  events.on('resumed', () => {
    logger.info(`${JobQueueName} has been resumed`)
  })

  events.on('error', (error) => {
    logger.error(`${JobQueueName} encountered an error`, error)
  })

  return events
})

export const addToJobQueue = async (jobType: JobTypes): Promise<string> => {
  const jobId = randomUUID()
  const options = jobOptions[jobType.name]
  await jobQueue().add(jobType.name, jobType.payload, { jobId, removeOnComplete: true, removeDependencyOnFailure: true, ...options })
  return jobId
}
