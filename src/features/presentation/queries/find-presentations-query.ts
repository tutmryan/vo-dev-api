import type { FindOptionsOrder } from 'typeorm'
import { type FindOptionsRelations, type FindOptionsWhere } from 'typeorm'
import type { QueryContext } from '../../../cqrs/query-context'
import type { Maybe, PresentationWhere } from '../../../generated/graphql'
import { OrderDirection, PresentationOrderBy } from '../../../generated/graphql'
import { BetweenTimestamp, LessThanOrEqualTimestamp, MoreThanOrEqualTimestamp } from '../../../util/typeorm'
import { PresentationEntity } from '../entities/presentation-entity'

export async function FindPresentationsQuery(
  this: QueryContext,
  criteria?: Maybe<PresentationWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
  orderBy?: Maybe<PresentationOrderBy>,
  orderDirection?: Maybe<OrderDirection>,
) {
  const where: FindOptionsWhere<PresentationEntity> = {}
  const relations: FindOptionsRelations<PresentationEntity> = {}
  const order: FindOptionsOrder<PresentationEntity> = {}

  if (criteria?.requestId) where.requestId = criteria.requestId.toUpperCase()
  if (criteria?.identityId) where.identityId = criteria.identityId.toUpperCase()
  if (criteria?.requestedById) where.requestedById = criteria.requestedById.toUpperCase()
  if (criteria?.contractId) {
    relations.issuances = true
    where.issuances = { contractId: criteria.contractId.toUpperCase() }
  }

  if (criteria?.from && criteria.to) where.presentedAt = BetweenTimestamp(criteria.from, criteria.to)
  else if (criteria?.from) where.presentedAt = MoreThanOrEqualTimestamp(criteria.from)
  else if (criteria?.to) where.presentedAt = LessThanOrEqualTimestamp(criteria.to)

  const direction = orderDirection ?? OrderDirection.Asc
  switch (orderBy) {
    case PresentationOrderBy.ContractName:
      relations.issuances = { contract: true }
      order.issuances = { contract: { name: direction } }
      break
    case PresentationOrderBy.IdentityName:
      relations.identity = true
      order.identity = { name: direction }
      break
    case PresentationOrderBy.PresentedAt:
      order.presentedAt = direction
      break
    case PresentationOrderBy.RequestedByName:
      relations.requestedBy = true
      order.requestedBy = { name: direction }
      break
    default:
      order.presentedAt = direction
      break
  }

  const presentations = await this.entityManager.getRepository(PresentationEntity).find({
    comment: 'FindPresentationsQuery',
    where,
    relations,
    skip: offset ?? undefined,
    take: limit ?? undefined,
    order,
  })

  return presentations
}
