import { isNil } from 'lodash'
import { logger } from '../logger'
import { pubsub } from '../redis/pubsub'
import { monitorServicesResultHandler } from '../services/monitoring/job'
import type { PartialRecord } from '../util/partial-record'
import { jobOptions, type JobNames, type JobTypes } from './jobs'
import { jobQueue } from './queue'

type ResultHandlerMap<T extends { name: JobNames }> = {
  [J in T as J['name']]?: (result: any) => void | Promise<void>
}

// https://docs.bullmq.io/guide/job-schedulers/repeat-strategies
type JobSchedule = { every: number } | { pattern: string }

// To add a new scheduled job:
// 1. Configure the job (in the usual way) in src/background-jobs/jobs.ts
// 2. Add the schedule to scheduledJobConfig
// 3. Optionally add a result handler to scheduledJobResultHandlers

const scheduledJobConfig: PartialRecord<JobNames, JobSchedule> = {
  monitorServices: { every: 5 * 60 * 1000 },
}

const scheduledJobResultHandlers: ResultHandlerMap<JobTypes> = {
  monitorServices: monitorServicesResultHandler,
}

const SCHEDULED_JOB_RESULT_TOPIC = 'scheduledJobResult'

export const publishScheduledJobResult = (jobName: JobNames, result: any) =>
  pubsub().publish(`${SCHEDULED_JOB_RESULT_TOPIC}.${jobName}`, { jobName, result: JSON.stringify(result) })

export async function initialiseScheduledJobs() {
  await subscribeToScheduledJobResults()
  await scheduleJobs()
}

function subscribeToScheduledJobResults() {
  return pubsub().subscribe(`${SCHEDULED_JOB_RESULT_TOPIC}.*`, handleScheduledJobResult, { pattern: true })
}

async function handleScheduledJobResult({ jobName, result }: { jobName: JobNames; result: any }) {
  const handler = scheduledJobResultHandlers[jobName as JobNames]
  if (handler) {
    try {
      await handler(isNil(result) ? undefined : JSON.parse(result))
    } catch (error) {
      logger.error(`Error handling scheduled job result for job ${jobName}`, { error })
    }
  }
}

async function scheduleJobs() {
  for (const [jobName, schedule] of Object.entries(scheduledJobConfig)) {
    await scheduleJob({ name: jobName } as JobTypes, schedule)
  }
}

async function scheduleJob(jobType: JobTypes, schedule: JobSchedule) {
  const options = jobOptions[jobType.name]
  await jobQueue().upsertJobScheduler(jobType.name, schedule, {
    name: jobType.name,
    opts: { removeDependencyOnFailure: true, ...options },
  })
}
