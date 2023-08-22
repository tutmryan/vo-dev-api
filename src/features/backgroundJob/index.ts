import { getJobQueue } from './queue'
import { getWorker } from './worker'

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
