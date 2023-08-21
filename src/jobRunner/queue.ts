import type { Job } from 'bullmq'
import { Queue } from 'bullmq'
import { redisOptions } from '../redis'

export const JobQueueName = 'jobQueue'

type JobType<TName extends string, TPayload> = {
  name: TName
  payload: TPayload
}

export type RevokeCredentialsJobName = 'revokeCredentials'
export type RevokeCredentialsJobType = JobType<RevokeCredentialsJobName, string[]>

export type JobNames = RevokeCredentialsJobName
export type JobTypes = RevokeCredentialsJobType

export const jobQueue = new Queue(JobQueueName, { connection: redisOptions })
export const addToJobQueue = async (job: JobTypes): Promise<Job> => {
  return jobQueue.add(job.name, job.payload)
}
