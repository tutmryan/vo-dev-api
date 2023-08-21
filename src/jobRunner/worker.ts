import type { Job } from 'bullmq'
import { Worker } from 'bullmq'
import { redisOptions } from '../redis'
import type { JobNames, JobTypes } from './queue'
import { JobQueueName } from './queue'
import { revokeCredentialsJobHandler } from './revoke-credentials-job-handler'

type HandlerMap<T extends { name: JobNames }> = {
  [J in T as J['name']]?: (job: Job) => Promise<void>
}

const handlers: HandlerMap<JobTypes> = {
  revokeCredentials: revokeCredentialsJobHandler,
}

export const worker = new Worker(
  JobQueueName,
  async (job) => {
    const handler = handlers[job.name as JobNames]
    if (handler) {
      await handler(job)
    }
  },
  { concurrency: 10, connection: redisOptions },
)
