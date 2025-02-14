import { initialiseSubscriberClient } from '../redis/pubsub'
import { jobQueue as getJobQueue, jobQueueEvents as getJobQueueEvents } from './queue'
import { initialiseScheduledJobs } from './scheduler'
import { worker as getWorker } from './worker'

export async function useBackgroundJob() {
  await initialiseSubscriberClient() // eagerly initialize subscription client before starting job processing

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

export { addToJobQueue, runDeduplicatedJob } from './queue'
