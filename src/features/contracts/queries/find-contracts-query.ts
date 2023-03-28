import type { QueryContext } from '../../../cqrs/query-context'
import type { ContractWhere, Maybe } from '../../../generated/graphql'
import type { FindOptionsWhere } from 'typeorm'
import { ILike } from 'typeorm'
import { ContractEntity } from '../entities/contract-entity'

export async function FindContractsQuery(
  this: QueryContext,
  criteria?: Maybe<ContractWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
) {
  const where: FindOptionsWhere<ContractEntity> = {}

  if (criteria?.name) where.name = ILike(`%${criteria.name}%`)
  if (criteria?.templateID) where.templateId = criteria.templateID

  const contracts = await this.entityManager.getRepository(ContractEntity).find({
    where,
    skip: offset ?? undefined,
    take: limit ?? undefined,
  })

  return contracts
}
