import { IsNull, type FindOptionsOrder, type FindOptionsRelations, type FindOptionsWhere } from 'typeorm'
import type { QueryContext } from '../../../cqs'
import { IssuanceOrderBy, IssuanceStatus, OrderDirection, type IssuanceWhere, type Maybe } from '../../../generated/graphql'
import { LessThanOrEqualTimestamp, MoreThanOrEqualTimestamp, OptionalRange } from '../../../util/typeorm'
import { IssuanceEntity } from '../entities/issuance-entity'

export async function FindIssuancesQuery(
  this: QueryContext,
  criteria?: Maybe<IssuanceWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
  orderBy?: Maybe<IssuanceOrderBy>,
  orderDirection?: Maybe<OrderDirection>,
) {
  const where: FindOptionsWhere<IssuanceEntity> = {}
  const relations: FindOptionsRelations<IssuanceEntity> = {}
  const order: FindOptionsOrder<IssuanceEntity> = {}

  if (criteria?.requestId) where.requestId = criteria.requestId.toUpperCase()
  if (criteria?.identityId) where.identityId = criteria.identityId.toUpperCase()
  if (criteria?.contractId) where.contractId = criteria.contractId.toUpperCase()
  if (criteria?.issuedById) where.issuedById = criteria.issuedById.toUpperCase()
  if (criteria?.revokedById) where.revokedById = criteria.revokedById.toUpperCase()
  if (criteria?.hasFaceCheckPhoto !== null && criteria?.hasFaceCheckPhoto !== undefined) {
    where.hasFaceCheckPhoto = criteria.hasFaceCheckPhoto
  }

  where.issuedAt = OptionalRange(criteria?.from, criteria?.to)
  where.expiresAt = OptionalRange(criteria?.expiresFrom, criteria?.expiresTo)
  where.revokedAt = OptionalRange(criteria?.revokedFrom, criteria?.revokedTo)

  if (criteria?.status === IssuanceStatus.Active) {
    where.revokedAt = IsNull()
    where.expiresAt = MoreThanOrEqualTimestamp(new Date())
  } else if (criteria?.status === IssuanceStatus.Expired) {
    where.expiresAt = LessThanOrEqualTimestamp(new Date())
  } else if (criteria?.status === IssuanceStatus.Revoked) {
    where.isRevoked = true
  }

  const direction = orderDirection ?? OrderDirection.Asc
  switch (orderBy) {
    case IssuanceOrderBy.ContractName:
      relations.contract = true
      order.contract = { name: direction }
      break
    case IssuanceOrderBy.ExpiresAt:
      order.expiresAt = direction
      break
    case IssuanceOrderBy.IdentityName:
      relations.identity = true
      order.identity = { name: direction }
      break
    case IssuanceOrderBy.IssuedAt:
      order.issuedAt = orderDirection ?? OrderDirection.Desc
      break
    case IssuanceOrderBy.IssuedByName:
      relations.issuedBy = true
      order.issuedBy = { name: direction }
      break
    default:
      order.issuedAt = orderDirection ?? OrderDirection.Desc
      break
  }

  const issuances = await this.entityManager.getRepository(IssuanceEntity).find({
    comment: 'FindIssuancesQuery',
    where,
    relations,
    skip: offset ?? undefined,
    take: limit ?? undefined,
    order,
  })

  return issuances
}
