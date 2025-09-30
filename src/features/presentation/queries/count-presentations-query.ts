import { Not, type FindOptionsRelations, type FindOptionsWhere } from 'typeorm'
import type { QueryContext } from '../../../cqs'
import type { Maybe, PresentationWhere } from '../../../generated/graphql'
import { BetweenTimestamp, LessThanOrEqualTimestamp, MoreThanOrEqualTimestamp } from '../../../util/typeorm'
import type { IssuanceEntity } from '../../issuance/entities/issuance-entity'
import { PresentationEntity } from '../entities/presentation-entity'
import { faceCheckRequested } from './find-presentations-query'

export async function CountPresentationsQuery(this: QueryContext, criteria?: Maybe<PresentationWhere>) {
  const where: FindOptionsWhere<PresentationEntity> = {}
  const relations: FindOptionsRelations<PresentationEntity> = {}

  if (criteria?.requestId) where.requestId = criteria.requestId
  if (criteria?.identityId) where.identityId = criteria.identityId
  if (criteria?.contractId || criteria?.issuanceId) {
    relations.issuances = true
    const issuanceWhere: FindOptionsWhere<IssuanceEntity> = {}
    if (criteria.contractId) issuanceWhere.contractId = criteria.contractId
    if (criteria.issuanceId) issuanceWhere.id = criteria.issuanceId
    where.issuances = issuanceWhere
  }
  if (criteria?.requestedById) where.requestedById = criteria.requestedById
  if (criteria?.partnerId) {
    relations.partners = true
    where.partners = { id: criteria.partnerId }
  }
  if (criteria?.oidcClientId) where.oidcClientId = criteria.oidcClientId
  if (criteria?.walletId) where.walletId = criteria.walletId

  if (criteria?.from && criteria.to) where.presentedAt = BetweenTimestamp(criteria.from, criteria.to)
  else if (criteria?.from) where.presentedAt = MoreThanOrEqualTimestamp(criteria.from)
  else if (criteria?.to) where.presentedAt = LessThanOrEqualTimestamp(criteria.to)

  if (criteria?.isFaceCheckRequested === true) where.requestedCredentialsJson = faceCheckRequested
  else if (criteria?.isFaceCheckRequested === false) where.requestedCredentialsJson = Not(faceCheckRequested)

  if (criteria?.identityStoreId) {
    relations.identity = true
    where.identity = { identityStoreId: criteria.identityStoreId }
  }

  const count = await this.entityManager.getRepository(PresentationEntity).count({
    comment: 'CountPresentationsQuery',
    relations,
    where,
    ...(relations.partners ? { withDeleted: true } : {}),
  })

  return count
}
