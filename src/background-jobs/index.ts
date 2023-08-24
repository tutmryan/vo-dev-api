import { jobQueue as getJobQueue } from './queue'
import { worker as getWorker } from './worker'

export function useBackgroundJob() {
  const jobQueue = getJobQueue()
  const worker = getWorker()
  return {
    dispose: async () => {
      await jobQueue.close()
      await worker.close()
    },
  }
}
