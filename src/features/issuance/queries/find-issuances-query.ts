import type { FindOptionsWhere } from 'typeorm'
import type { QueryContext } from '../../../cqrs/query-context'
import type { IssuanceWhere, Maybe } from '../../../generated/graphql'
import { BetweenTimestamp, LessThanOrEqualTimestamp, MoreThanOrEqualTimestamp } from '../../../util/typeorm'
import { IssuanceEntity } from '../entities/issuance-entity'

export async function FindIssuancesQuery(
  this: QueryContext,
  criteria?: Maybe<IssuanceWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
) {
  const where: FindOptionsWhere<IssuanceEntity> = {}

  if (criteria?.identityId) where.identityId = criteria.identityId.toUpperCase()
  if (criteria?.contractId) where.contractId = criteria.contractId.toUpperCase()
  if (criteria?.userId) where.userId = criteria.userId.toUpperCase()

  if (criteria?.from && criteria.to) where.issuedAt = BetweenTimestamp(criteria.from, criteria.to)
  else if (criteria?.from) where.issuedAt = MoreThanOrEqualTimestamp(criteria.from)
  else if (criteria?.to) where.issuedAt = LessThanOrEqualTimestamp(criteria.to)

  const issuances = await this.entityManager.getRepository(IssuanceEntity).find({
    where,
    skip: offset ?? undefined,
    take: limit ?? undefined,
    order: { issuedAt: 'DESC' },
  })

  return issuances
}
