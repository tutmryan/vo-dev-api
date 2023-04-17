import type { FindOptionsWhere } from 'typeorm'
import type { QueryContext } from '../../../cqrs/query-context'
import type { IssuanceWhere, Maybe } from '../../../generated/graphql'
import { IssuanceEntity } from '../entities/issuance-entity'

export async function FindIssuancesQuery(
  this: QueryContext,
  criteria?: Maybe<IssuanceWhere & { contractId?: string }>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
) {
  const where: FindOptionsWhere<IssuanceEntity> = {}

  if (criteria?.identityId) where.identityId = criteria.identityId.toUpperCase()
  if (criteria?.contractId) where.contractId = criteria.contractId.toUpperCase()

  const issuances = await this.entityManager.getRepository(IssuanceEntity).find({
    where,
    skip: offset ?? undefined,
    take: limit ?? undefined,
  })

  return issuances
}
