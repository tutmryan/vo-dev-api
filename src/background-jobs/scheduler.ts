import type { JobsOptions } from 'bullmq'
import { isNil } from 'lodash'
import { logger } from '../logger'
import { pubsub } from '../redis/pubsub'
import { getJobConfig, jobs, type JobSchedule } from './jobs'
import { jobQueue } from './queue'

const SCHEDULED_JOB_RESULT_TOPIC = 'scheduledJobResult'

type ScheduledJobResult = { jobName: string; result: any }

export const publishScheduledJobResult = ({ jobName, result }: ScheduledJobResult) =>
  pubsub().publish(`${SCHEDULED_JOB_RESULT_TOPIC}.${jobName}`, { jobName, result: JSON.stringify(result) })

export async function initialiseScheduledJobs() {
  await subscribeToScheduledJobResults()
  await scheduleJobs()
}

function subscribeToScheduledJobResults() {
  return pubsub().subscribe(`${SCHEDULED_JOB_RESULT_TOPIC}.*`, handleScheduledJobResult, { pattern: true })
}

async function handleScheduledJobResult({ jobName, result }: ScheduledJobResult) {
  const handler = getJobConfig(jobName)?.scheduledJobResultHandler
  if (handler) {
    try {
      await handler(isNil(result) ? undefined : JSON.parse(result))
    } catch (error) {
      logger.error(`Error running scheduled job result handler for job: ${jobName}`, { error })
    }
  }
}

async function scheduleJobs() {
  for (const [name, data] of Object.entries(jobs)) {
    if (data.schedule) await scheduleJob(name, data.schedule, data.options)
  }

  // clear out old scheduled jobs no longer in config, or they will continue to run
  const jobSchedulers = await jobQueue().getJobSchedulers()
  jobSchedulers.forEach(async (scheduler) => {
    // Despite the typing, It has been observed that the name is undefined but the key is set
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const nameOrKey = scheduler.name ?? scheduler.key
    const job = getJobConfig(nameOrKey)
    if (!job?.schedule) {
      logger.warn(`Scheduled job ${nameOrKey} is not defined with a schedule in current config, removing scheduler...`)
      const removed = await jobQueue().removeJobScheduler(nameOrKey)
      if (removed) logger.warn(`Scheduled job ${nameOrKey} has been removed`)
      else logger.error(`Scheduled job ${nameOrKey} could not be removed`)
    }
  })
}

async function scheduleJob(name: string, schedule: JobSchedule, options?: JobsOptions) {
  await jobQueue().upsertJobScheduler(name, schedule, {
    name,
    opts: { removeDependencyOnFailure: true, ...options },
  })
}
