import { jobQueue as getJobQueue, jobQueueEvents as getJobQueueEvents } from './queue'
import { worker as getWorker } from './worker'

export function useBackgroundJob() {
  const jobQueue = getJobQueue()
  const jobQueueEvents = getJobQueueEvents()
  const worker = getWorker()
  return {
    dispose: async () => {
      await jobQueueEvents.close()
      await jobQueue.close()
      await worker.close()
    },
  }
}

export { addToJobQueue, runDeduplicatedJob } from './queue'
