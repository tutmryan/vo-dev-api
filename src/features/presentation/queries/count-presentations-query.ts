import type { FindOptionsRelations, FindOptionsWhere } from 'typeorm'
import type { QueryContext } from '../../../cqs'
import type { Maybe, PresentationWhere } from '../../../generated/graphql'
import { BetweenTimestamp, LessThanOrEqualTimestamp, MoreThanOrEqualTimestamp } from '../../../util/typeorm'
import type { IssuanceEntity } from '../../issuance/entities/issuance-entity'
import { PresentationEntity } from '../entities/presentation-entity'

export async function CountPresentationsQuery(this: QueryContext, criteria?: Maybe<PresentationWhere>) {
  const where: FindOptionsWhere<PresentationEntity> = {}
  const relations: FindOptionsRelations<PresentationEntity> = {}

  if (criteria?.requestId) where.requestId = criteria.requestId.toUpperCase()
  if (criteria?.identityId) where.identityId = criteria.identityId.toUpperCase()
  if (criteria?.contractId || criteria?.issuanceId) {
    relations.issuances = true
    const issuanceWhere: FindOptionsWhere<IssuanceEntity> = {}
    if (criteria.contractId) issuanceWhere.contractId = criteria.contractId.toUpperCase()
    if (criteria.issuanceId) issuanceWhere.id = criteria.issuanceId.toUpperCase()
    where.issuances = issuanceWhere
  }
  if (criteria?.requestedById) where.requestedById = criteria.requestedById.toUpperCase()
  if (criteria?.partnerId) {
    relations.partners = true
    where.partners = { id: criteria.partnerId.toUpperCase() }
  }

  if (criteria?.from && criteria.to) where.presentedAt = BetweenTimestamp(criteria.from, criteria.to)
  else if (criteria?.from) where.presentedAt = MoreThanOrEqualTimestamp(criteria.from)
  else if (criteria?.to) where.presentedAt = LessThanOrEqualTimestamp(criteria.to)

  const count = await this.entityManager.getRepository(PresentationEntity).count({
    comment: 'CountPresentationsQuery',
    relations,
    where,
  })

  return count
}
