import { UnrecoverableError, type Job } from 'bullmq'
import type { RevokeContractIssuancesJobPayload } from '../../../background-jobs/queue'
import type { WorkerContext } from '../../../background-jobs/worker'
import { ISOLATION_LEVEL as TXN_ISOLATION_LEVEL, dataSource } from '../../../data'
import type { AdminService } from '../../../services/admin'
import { invariant } from '../../../util/invariant'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { IssuanceEntity } from '../../issuance/entities/issuance-entity'
import type { UserEntity } from '../../users/entities/user-entity'

export const revokeContractIssuancesJobHandler = async (
  context: WorkerContext,
  job: Omit<Job, 'data'> & { data: RevokeContractIssuancesJobPayload },
) => {
  const errorMessages = []
  const { logger, adminService, user } = context

  const contract = await dataSource.getRepository(ContractEntity).findOneBy({ id: job.data.contractId })
  if (!contract?.externalId)
    throw new UnrecoverableError(`Contract (${job.data.contractId}) must have been provisioned for issuances to exist.`)

  const issuances = await dataSource.getRepository(IssuanceEntity).find({ where: { contractId: job.data.contractId } })
  for (let index = 0; index < issuances.length; index++) {
    const issuance = issuances[index]!
    try {
      // start a new transaction for each issuance revocation
      await dataSource.manager.transaction(TXN_ISOLATION_LEVEL, async (entityManager) => {
        logger.info(`revoking issuance ${issuance.id}`)

        const result = await revokeIssuance(contract, issuance, adminService, user)
        await entityManager.getRepository(IssuanceEntity).save(result)
      })
    } catch (err) {
      logger.error(`Error occurred when revoking the issuance ${issuance.id}`, err)
      errorMessages.push(`Error occurred when revoking the issuance ${issuance.id}: ${(err as Error).message}`)
    } finally {
      job.updateProgress(Math.floor(((index + 1) / issuances.length) * 100))
    }
  }
  if (errorMessages.length > 0) {
    throw new Error(errorMessages.join('\n'))
  }
}

const revokeIssuance = async (contract: ContractEntity, issuance: IssuanceEntity, admin: AdminService, user: UserEntity) => {
  // if the issuance has been previously revoked, we don't need to proceed further
  if (issuance.isRevoked) return issuance

  const credential = await admin.findCredential(contract.externalId!, issuance.id)
  invariant(credential, 'Credential with issuance id as an index claim could not be found')

  await admin.revokeCredential(contract.externalId!, credential.id)

  issuance.markAsRevoked(user)
  return issuance
}
