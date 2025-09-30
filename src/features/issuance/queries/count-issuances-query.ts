import type { FindOptionsRelations } from 'typeorm'
import { IsNull, Raw, type FindOptionsWhere } from 'typeorm'
import type { QueryContext } from '../../../cqs'
import { IssuanceStatus, type IssuanceWhere, type Maybe } from '../../../generated/graphql'
import { LessThanOrEqualTimestamp, MoreThanOrEqualTimestamp, OptionalRange } from '../../../util/typeorm'
import { IssuanceEntity } from '../entities/issuance-entity'

export async function CountIssuancesQuery(this: QueryContext, criteria?: Maybe<IssuanceWhere>) {
  const where: FindOptionsWhere<IssuanceEntity> = {}
  const relations: FindOptionsRelations<IssuanceEntity> = {}
  if (criteria?.requestId) where.requestId = criteria.requestId
  if (criteria?.identityId) where.identityId = criteria.identityId
  if (criteria?.contractId) where.contractId = criteria.contractId
  if (criteria?.issuedById) where.issuedById = criteria.issuedById
  if (criteria?.revokedById) where.revokedById = criteria.revokedById
  if (criteria?.hasFaceCheckPhoto !== null && criteria?.hasFaceCheckPhoto !== undefined) {
    where.hasFaceCheckPhoto = Raw((alias) => `ISNULL(${alias}, 0) = :hasFaceCheckPhoto`, { hasFaceCheckPhoto: criteria.hasFaceCheckPhoto })
  }
  if (criteria?.presentationId) {
    relations.presentations = true
    where.presentations = {
      id: criteria.presentationId,
    }
  }
  if (criteria?.identityStoreId) {
    relations.identity = true
    where.identity = { identityStoreId: criteria.identityStoreId }
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

  const count = await this.entityManager.getRepository(IssuanceEntity).count({
    comment: 'CountIssuancesQuery',
    where,
    relations,
  })

  return count
}
