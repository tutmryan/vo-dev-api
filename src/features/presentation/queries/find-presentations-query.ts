import type { FindOptionsRelations, FindOptionsWhere } from 'typeorm'
import type { QueryContext } from '../../../cqrs/query-context'
import type { Maybe, PresentationWhere } from '../../../generated/graphql'
import { BetweenTimestamp, LessThanOrEqualTimestamp, MoreThanOrEqualTimestamp } from '../../../util/typeorm'
import { PresentationEntity } from '../entities/presentation-entity'

export async function FindPresentationsQuery(
  this: QueryContext,
  criteria?: Maybe<PresentationWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
) {
  const where: FindOptionsWhere<PresentationEntity> = {}
  const relations: FindOptionsRelations<PresentationEntity> = {}

  if (criteria?.identityId) where.identityId = criteria.identityId.toUpperCase()
  if (criteria?.userId) where.userId = criteria.userId.toUpperCase()
  if (criteria?.contractId) {
    relations.contracts = true
    where.contracts = { id: criteria.contractId.toUpperCase() }
  }

  if (criteria?.from && criteria.to) where.presentedAt = BetweenTimestamp(criteria.from, criteria.to)
  else if (criteria?.from) where.presentedAt = MoreThanOrEqualTimestamp(criteria.from)
  else if (criteria?.to) where.presentedAt = LessThanOrEqualTimestamp(criteria.to)

  const presentations = await this.entityManager.getRepository(PresentationEntity).find({
    comment: 'FindPresentationsQuery',
    where,
    relations,
    skip: offset ?? undefined,
    take: limit ?? undefined,
    order: { presentedAt: 'DESC' },
  })

  return presentations
}
