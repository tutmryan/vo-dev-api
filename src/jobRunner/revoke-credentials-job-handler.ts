import type { Job } from 'bullmq'

export const revokeCredentialsJobHandler = (_job: Job) => {
  return Promise.resolve()
}
