import { Queue } from 'bullmq'
import { randomUUID } from 'crypto'
import { redisOptions } from '../../redis'

export const JobQueueName = 'jobQueue'
export const MAX_RETRY = 3
type JobType<TName extends string, TPayload extends { userId: string }> = {
  name: TName
  payload: TPayload
}

export type RevokeIssuancesJobName = 'revokeIssuances'
export type RevokeIssuancesJobPayload = { userId: string; issuanceIds: string[] }
export type RevokeIssuancesJobType = JobType<RevokeIssuancesJobName, RevokeIssuancesJobPayload>

export type RevokeContractIssuancesJobName = 'revokeContractIssuances'
export type RevokeContractIssuancesJobPayload = { userId: string; contractId: string }
export type RevokeContractIssuancesJobType = JobType<RevokeContractIssuancesJobName, RevokeContractIssuancesJobPayload>

export type JobNames = RevokeIssuancesJobName | RevokeContractIssuancesJobName
export type JobTypes = RevokeIssuancesJobType | RevokeContractIssuancesJobType

let jobQueue: Queue | null = null
export const getJobQueue = () =>
  jobQueue ||
  (jobQueue = new Queue(JobQueueName, {
    connection: redisOptions,
    defaultJobOptions: {
      attempts: MAX_RETRY,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  }))
export const addToJobQueue = async (jobType: JobTypes): Promise<string> => {
  const jobId = randomUUID()
  await getJobQueue().add(jobType.name, jobType.payload, { jobId })
  return jobId
}
