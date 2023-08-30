import { Queue, QueueEvents } from 'bullmq'
import { randomUUID } from 'crypto'
import { logger } from '../logger'
import { redisOptions } from '../redis'
import { Lazy } from '../util/lazy'

export const JobQueueName = 'jobQueue'
export const MAX_RETRY = 3
type JobType<TName extends string, TPayload extends { userId: string }> = {
  correlationId?: string
  name: TName
  payload: TPayload
}

export type RevokeIssuancesJobName = 'revokeIssuances'
export type RevokeIssuancesJobPayload = { userId: string; issuanceIds: string[] }
export type RevokeIssuancesJobType = JobType<RevokeIssuancesJobName, RevokeIssuancesJobPayload>

export type RevokeContractIssuancesJobName = 'revokeContractIssuances'
export type RevokeContractIssuancesJobPayload = { userId: string; contractId: string }
export type RevokeContractIssuancesJobType = JobType<RevokeContractIssuancesJobName, RevokeContractIssuancesJobPayload>

export type RevokeIdentityIssuancesJobName = 'revokeIdentityIssuances'
export type RevokeIdentityIssuancesJobPayload = { userId: string; identityId: string }
export type RevokeIdentityIssuancesJobType = JobType<RevokeIdentityIssuancesJobName, RevokeIdentityIssuancesJobPayload>

export type JobNames = RevokeIssuancesJobName | RevokeContractIssuancesJobName | RevokeIdentityIssuancesJobName
export type JobTypes = RevokeIssuancesJobType | RevokeContractIssuancesJobType | RevokeIdentityIssuancesJobType

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
  await jobQueue().add(jobType.name, jobType.payload, { jobId })
  return jobId
}
