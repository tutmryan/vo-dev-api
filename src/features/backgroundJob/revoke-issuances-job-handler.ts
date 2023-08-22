import type { Job } from 'bullmq'
import { IssuanceEntity } from '../issuance/entities/issuance-entity'
import type { RevokeIssuancesJobPayload } from './queue'
import type { WorkerContext } from './worker'

export const revokeIssuancesJobHandler = async (context: WorkerContext, job: Omit<Job, 'data'> & { data: RevokeIssuancesJobPayload }) => {
  // attempts to revoke all issuance ids in the payload even if any one of those fails
  // job is marked as failed if any issuance id fails to be revoked and the job is retried
  const { logger, entityManager } = context
  return new Promise<void>((resolve, reject) => {
    Promise.allSettled(
      job.data.issuanceIds.map(async (id, index) => {
        try {
          logger.info(`revoking issuance ${id}`)
          const issuance = await entityManager.getRepository(IssuanceEntity).findOneOrFail({ where: { id: id } })
          logger.info(`${issuance.id} found`)
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
}
