import { jobQueue } from './queue'
import { worker } from './worker'

export function useJobRunner() {
  return {
    dispose: async () => {
      await jobQueue.close()
      await worker.close()
    },
  }
}
