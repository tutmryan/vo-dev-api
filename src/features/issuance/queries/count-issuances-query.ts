import { IsNull, type FindOptionsWhere } from 'typeorm'
import type { QueryContext } from '../../../cqs'
import { IssuanceStatus, type IssuanceWhere, type Maybe } from '../../../generated/graphql'
import { LessThanOrEqualTimestamp, MoreThanOrEqualTimestamp, OptionalRange } from '../../../util/typeorm'
import { IssuanceEntity } from '../entities/issuance-entity'

export async function CountIssuancesQuery(this: QueryContext, criteria?: Maybe<IssuanceWhere>) {
  const where: FindOptionsWhere<IssuanceEntity> = {}

  if (criteria?.requestId) where.requestId = criteria.requestId.toUpperCase()
  if (criteria?.identityId) where.identityId = criteria.identityId.toUpperCase()
  if (criteria?.contractId) where.contractId = criteria.contractId.toUpperCase()
  if (criteria?.issuedById) where.issuedById = criteria.issuedById.toUpperCase()

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

  const count = await this.entityManager.getRepository(IssuanceEntity).count({
    comment: 'CountIssuancesQuery',
    where,
  })

  return count
}
