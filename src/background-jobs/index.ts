import { randomUUID } from 'crypto'
import { logger } from '../logger'
import { initialisePubsub } from '../redis/pubsub'
import type { Jobs } from './jobs'
import { jobs } from './jobs'
import { eventIsFinal, subscribeToBackgroundJobEvents } from './pubsub'
import { jobQueue as getJobQueue, jobQueueEvents as getJobQueueEvents, jobQueue } from './queue'
import { initialiseScheduledJobs } from './scheduler'
import { worker as getWorker } from './worker'

export async function useBackgroundJobs() {
  await initialisePubsub() // eagerly initialize pubsub clients before starting job processing

  const jobQueue = getJobQueue()
  const jobQueueEvents = getJobQueueEvents()
  const worker = getWorker()

  await initialiseScheduledJobs() // kick off scheduled jobs

  return {
    dispose: async () => {
      await jobQueueEvents.close()
      await jobQueue.close()
      await worker.close()
    },
  }
}

type JobName = keyof Jobs
type JobPayloadType<T extends JobName> = Parameters<Jobs[T]['handler']>[1]

export async function addToJobQueue(name: JobName, payload: JobPayloadType<JobName>, jobId: string = randomUUID()): Promise<string> {
  const options = jobs[name].options
  await jobQueue().add(name, payload, { jobId, removeDependencyOnFailure: true, ...options })
  return jobId
}

/**
 * Runs a deduplicated background job and optionally waits for its completion.
 * BullMQ deduplicates jobs by job ID, so we use the job type name as the job ID and await completion via the name.
 */
export async function runDeduplicatedJob(name: JobName, payload: JobPayloadType<JobName>, awaitCompletion: boolean): Promise<void> {
  logger.info(`Running deduplicated job: ${name}`)
  const jobId = name
  await addToJobQueue(name, payload, jobId)
  if (!awaitCompletion) return
  const iterator = subscribeToBackgroundJobEvents({ where: { jobId } })
  logger.info(`Waiting for deduplicated job completion: ${name}`)
  for await (const data of iterator) {
    if (eventIsFinal(data)) {
      logger.info(`Deduplicated job completed: ${name}`)
      return
    }
  }
}
