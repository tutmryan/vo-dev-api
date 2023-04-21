import type { FindOptionsWhere } from 'typeorm'
import { ILike, IsNull, Not } from 'typeorm'
import type { QueryContext } from '../../../cqrs/query-context'
import type { ContractWhere, Maybe } from '../../../generated/graphql'
import { ContractEntity } from '../entities/contract-entity'

export async function FindContractsQuery(
  this: QueryContext,
  criteria?: Maybe<ContractWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
) {
  const where: FindOptionsWhere<ContractEntity> = {}

  if (criteria?.name) where.name = ILike(`%${criteria.name}%`)
  if (criteria?.templateId) where.templateId = criteria.templateId
  if (criteria?.isProvisioned !== null && criteria?.isProvisioned !== undefined)
    where.provisionedAt = criteria.isProvisioned ? Not(IsNull()) : IsNull()

  const contracts = await this.entityManager.getRepository(ContractEntity).find({
    where,
    skip: offset ?? undefined,
    take: limit ?? undefined,
  })

  return contracts
}
