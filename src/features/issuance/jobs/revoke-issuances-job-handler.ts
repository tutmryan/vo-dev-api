import type { Job } from 'bullmq'
import { In } from 'typeorm'
import type { RevokeIssuancesJobPayload } from '../../../background-jobs/queue'
import type { WorkerContext } from '../../../background-jobs/worker'
import { ISOLATION_LEVEL as TXN_ISOLATION_LEVEL, dataSource } from '../../../data'
import type { AdminService } from '../../../services/admin'
import { invariant } from '../../../util/invariant'
import { IssuanceEntity } from '../../issuance/entities/issuance-entity'
import type { UserEntity } from '../../users/entities/user-entity'

export const revokeIssuancesJobHandler = async (context: WorkerContext, job: Omit<Job, 'data'> & { data: RevokeIssuancesJobPayload }) => {
  const errorMessages = []
  const { logger, adminService, user } = context
  const issuances = await dataSource.getRepository(IssuanceEntity).find({ where: { id: In(job.data.issuanceIds) } })

  for (let index = 0; index < job.data.issuanceIds.length; index++) {
    const id = job.data.issuanceIds[index]!
    try {
      // start a new transaction for each issuance revocation
      await dataSource.manager.transaction(TXN_ISOLATION_LEVEL, async (entityManager) => {
        logger.info(`revoking issuance ${id}`)

        const issuance = issuances.find((i) => i.id.toLowerCase() === id.toLowerCase())
        if (!issuance) throw new Error(`Issuance (${id}) not found.`)

        const result = await revokeIssuance(issuance, adminService, user)
        await entityManager.getRepository(IssuanceEntity).save(result)
      })
    } catch (err) {
      logger.error(`Error occurred when revoking the issuance ${id}`, err)
      errorMessages.push(`Error occurred when revoking the issuance ${id}: ${(err as Error).message}`)
    } finally {
      job.updateProgress(Math.floor(((index + 1) / job.data.issuanceIds.length) * 100))
    }
  }
  if (errorMessages.length > 0) {
    throw new Error(errorMessages.join('\n'))
  }
}

const revokeIssuance = async (issuance: IssuanceEntity, admin: AdminService, user: UserEntity) => {
  // if the issuance has been previously revoked, we don't need to proceed further
  if (issuance.isRevoked) return issuance

  const contractExternalId = (await issuance.contract).externalId
  invariant(contractExternalId, 'Contract must have been provisioned for an issuance to exist')

  const credential = await admin.findCredential(contractExternalId, issuance.id)
  invariant(credential, 'Credential with issuance id as an index claim could not be found')

  await admin.revokeCredential(contractExternalId, credential.id)

  issuance.markAsRevoked(user)
  return issuance
}
