import type { DefaultJobOptions } from 'bullmq'
import { Queue, QueueEvents } from 'bullmq'
import { randomUUID } from 'crypto'
import { logger } from '../logger'
import { redisOptions } from '../redis'
import { Lazy } from '../util/lazy'
import type { JobPayload, JobTypes } from './jobs'
import { jobOptions } from './jobs'
import { subscribeToBackgroundJobEvents } from './pubsub'

export const JobQueueName = 'jobQueue'
export type JobType<TName extends string, TPayload extends JobPayload> = {
  name: TName
  payload: TPayload
}

export const defaultJobOptions: DefaultJobOptions = {
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
}

export const jobQueue = Lazy(
  () =>
    new Queue(JobQueueName, {
      connection: redisOptions,
      defaultJobOptions,
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

export const addToJobQueue = async (jobType: JobTypes, jobId: string = randomUUID()): Promise<string> => {
  const options = jobOptions[jobType.name]
  await jobQueue().add(jobType.name, jobType.payload, { jobId, removeOnComplete: true, removeDependencyOnFailure: true, ...options })
  return jobId
}

export const runDeduplicatedJob = async (jobType: JobTypes, awaitCompletion: boolean): Promise<void> => {
  const jobId = await addToJobQueue(jobType, jobType.name)
  if (!awaitCompletion) return
  const iterator = subscribeToBackgroundJobEvents({ where: { jobId } })
  await iterator.next()
}
