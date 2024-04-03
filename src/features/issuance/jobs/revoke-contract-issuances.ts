import { UnrecoverableError } from 'bullmq'
import type { JobHandler } from '../../../background-jobs/jobs'
import type { JobType } from '../../../background-jobs/queue'
import { dataSource } from '../../../data'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { revokeIssuances } from './revoke-utils'

export type RevokeContractIssuancesJobName = 'revokeContractIssuances'
export type RevokeContractIssuancesJobPayload = { userId: string; contractId: string; requestId?: string }
export type RevokeContractIssuancesJobType = JobType<RevokeContractIssuancesJobName, RevokeContractIssuancesJobPayload>

export const revokeContractIssuancesJobHandler: JobHandler<RevokeContractIssuancesJobPayload> = async (context, job) => {
  const contract = await dataSource.getRepository(ContractEntity).findOneBy({ id: job.data.contractId })

  if (!contract?.externalId)
    throw new UnrecoverableError(`Contract (${job.data.contractId}) must have been provisioned for issuances to exist.`)

  return revokeIssuances(job, context, { contractId: job.data.contractId }, contract)
}
