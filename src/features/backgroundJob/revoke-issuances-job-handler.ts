import type { Job } from 'bullmq'
import { logger } from '../../logger'
import type { RevokeIssuancesJobPayload } from './queue'

export const revokeIssuancesJobHandler = async (job: Omit<Job, 'data'> & { data: RevokeIssuancesJobPayload }) => {
  // attempts to revoke all issuance ids in the payload even if any one of those fails
  // job is marked as failed if any issuance id fails to be revoked and the job is retried
  return new Promise<void>((resolve, reject) => {
    Promise.allSettled(
      job.data.issuanceIds.map((id, index) => {
        try {
          if (index === 5 || index === 7) throw new Error(`Index ${index} is going to fail`)
          logger.info(`revoking issuance ${id}`)
          return Promise.resolve()
        } catch (err) {
          logger.error(`Error occurred when revoking the issuance ${id}`, err)
          return Promise.reject(err)
        } finally {
          job.updateProgress(Math.floor(((index + 1) / job.data.issuanceIds.length) * 100))
        }
      }),
    ).then((results) => {
      const errors = results
        .filter((r) => r.status === 'rejected')
        .map((r) => (r as PromiseRejectedResult).reason.message)
        .join('\n')
      if (errors.length) reject(new Error(errors))
      resolve()
    })
  })

  // for (let i = 0; i < job.data.issuanceIds.length; i++) {
  //   try {
  //     if (i === 7) throw new Error('this is going to fail')
  //     logger.info(`revoking issuance ${job.data.issuanceIds[i]}`)
  //     job.updateProgress(Math.floor(((i + 1) / job.data.issuanceIds.length) * 100))
  //     logger.info(job.progress)
  //     await new Promise((r) => setTimeout(r, 1000))
  //   } catch (err) {
  //     logger.error(err)
  //   }
  // }
}
