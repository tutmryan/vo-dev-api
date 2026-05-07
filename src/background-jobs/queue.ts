import type { DefaultJobOptions } from 'bullmq'
import { Queue, QueueEvents } from 'bullmq'
import { logger } from '../logger'
import { redisOptions } from '../redis'
import { Lazy } from '../util/lazy'

// Hash tag required for Redis Enterprise (EnterpriseCluster) — ensures all BullMQ keys
// for this queue land in the same hash slot.
export const JobQueueName = '{jobQueue}'

export const defaultJobOptions: DefaultJobOptions = {
  removeOnComplete: true,
  removeOnFail: true,
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
    logger.info(`Job queue ${JobQueueName} has been paused`)
  })

  events.on('resumed', () => {
    logger.info(`Job queue ${JobQueueName} has been resumed`)
  })

  events.on('error', (error) => {
    logger.error(`Job queue ${JobQueueName} encountered an error`, error)
  })

  return events
})
