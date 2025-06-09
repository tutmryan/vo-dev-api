import { UnrecoverableError } from 'bullmq'
import type { JobHandler } from '../../../background-jobs/jobs'
import { dataSource } from '../../../data'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { revokeIssuances } from './revoke-utils'

export type RevokeContractIssuancesJobPayload = { userId: string; contractId: string; requestId?: string }

export const revokeContractIssuancesJobHandler: JobHandler<RevokeContractIssuancesJobPayload> = async (context, payload) => {
  const contract = await dataSource.getRepository(ContractEntity).findOneBy({ id: payload.contractId })

  if (!contract?.externalId)
    throw new UnrecoverableError(`Contract (${payload.contractId}) must have been provisioned for issuances to exist.`)

  return revokeIssuances(context, { contractId: payload.contractId }, contract)
}
