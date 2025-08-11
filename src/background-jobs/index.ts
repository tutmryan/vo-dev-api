import { randomUUID } from 'crypto'
import { isNil } from 'lodash'
import type { BackgroundJobErrorEvent } from '../generated/graphql'
import { logger } from '../logger'
import { initialisePubsub, pubsub } from '../redis/pubsub'
import type { Jobs } from './jobs'
import { getJobConfig, jobs } from './jobs'
import type { BackgroundJobTopicData } from './pubsub'
import { BACKGROUND_JOB_TOPIC, eventIsFinal, subscribeToBackgroundJobEvents } from './pubsub'
import { jobQueue as getJobQueue, jobQueueEvents as getJobQueueEvents, jobQueue } from './queue'
import { initialiseScheduledJobs } from './scheduler'
import { worker as getWorker } from './worker'

function subscribeToJobResults() {
  return pubsub().subscribe(`${BACKGROUND_JOB_TOPIC}.*`, handleJobResult, { pattern: true })
}

async function handleJobResult(data: BackgroundJobTopicData) {
  if (!('result' in data.event)) return
  const {
    jobName,
    event: { result },
  } = data
  const handler = getJobConfig(jobName)?.jobResultHandler
  if (handler) {
    try {
      await handler(isNil(result) ? undefined : result)
    } catch (error) {
      logger.error(`Error running job result handler for job: ${jobName}`, { error })
    }
  }
}

export async function useBackgroundJobs() {
  await initialisePubsub() // eagerly initialize pubsub clients before starting job processing

  const jobQueue = getJobQueue()
  const jobQueueEvents = getJobQueueEvents()
  const worker = getWorker()

  const subscription = await subscribeToJobResults()
  await initialiseScheduledJobs() // kick off scheduled jobs

  return {
    dispose: async () => {
      await jobQueueEvents.close()
      await jobQueue.close()
      await worker.close()
      pubsub().unsubscribe(subscription)
    },
  }
}

export type JobName = keyof Jobs
export type JobPayload<T extends JobName> = Parameters<Jobs[T]['handler']>[1]
export type JobResult<T extends JobName> = Partial<Awaited<ReturnType<Jobs[T]['handler']>>>

export async function addToJobQueue(name: JobName, payload: JobPayload<JobName>, jobId: string = randomUUID()): Promise<string> {
  const options = jobs[name].options
  await jobQueue().add(name, payload, { jobId, removeDependencyOnFailure: true, ...options })
  return jobId
}

/**
 * Runs a background job immediately and waits for completion via subscription to background job events.
 * If the job completes successfully, it returns the result.
 * If the job fails, it returns a BackgroundJobErrorEvent.
 */
export async function runAndAwaitJob<T extends JobName>(
  name: T,
  payload: JobPayload<T>,
  jobId: string = randomUUID(),
): Promise<JobResult<T> | BackgroundJobErrorEvent | undefined> {
  logger.verbose(`Running job: ${name}`)
  await addToJobQueue(name, payload, jobId)
  const iterator = subscribeToBackgroundJobEvents({ where: { jobId } })
  logger.verbose(`Waiting for job completion: ${name}`)
  for await (const data of iterator) {
    if (eventIsFinal(data)) {
      logger.verbose(`Job completed: ${name}`)
      return data.event.__typename === 'BackgroundJobCompletedEvent'
        ? (data.event.result as JobResult<T>)
        : (data.event as BackgroundJobErrorEvent)
    }
  }
  return undefined
}

/**
 * Runs a deduplicated background job and optionally waits for its completion.
 * BullMQ deduplicates jobs by job ID, so we use the job type name as the job ID and await completion via the name.
 * Deduplication options are set in the job configuration.
 * If `awaitCompletion` is false, the function returns undefined immediately after adding the job to the queue.
 * If `awaitCompletion` is true, it subscribes to background job events and waits for the job to complete, then returns the result or BackgroundJobErrorEvent.
 */
export async function runDeduplicatedJob(
  name: JobName,
  payload: JobPayload<JobName>,
  awaitCompletion: boolean,
): Promise<JobResult<JobName> | BackgroundJobErrorEvent | undefined> {
  logger.verbose(`Running deduplicated job: ${name}`)
  const jobId = name
  await addToJobQueue(name, payload, jobId)
  if (!awaitCompletion) return undefined
  const iterator = subscribeToBackgroundJobEvents({ where: { jobId } })
  logger.verbose(`Waiting for deduplicated job completion: ${name}`)
  for await (const data of iterator) {
    if (eventIsFinal(data)) {
      logger.verbose(`Deduplicated job completed: ${name}`)
      return data.event.__typename === 'BackgroundJobCompletedEvent' ? (data.event.result as JobResult<JobName>) : data.event
    }
  }
  return undefined
}
