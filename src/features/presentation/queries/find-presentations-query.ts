import type { FindOptionsOrder } from 'typeorm'
import { ILike, Not, type FindOptionsRelations, type FindOptionsWhere } from 'typeorm'
import type { QueryContext } from '../../../cqs'
import type { Maybe, PresentationWhere } from '../../../generated/graphql'
import { OrderDirection, PresentationOrderBy } from '../../../generated/graphql'
import { OptionalRange } from '../../../util/typeorm'
import type { IssuanceEntity } from '../../issuance/entities/issuance-entity'
import { PresentationEntity } from '../entities/presentation-entity'

export const FACE_CHECK_REQUESTED_LIKE_MATCH = `%"configuration":{"validation":%"faceCheck":%`
export const faceCheckRequested = ILike(FACE_CHECK_REQUESTED_LIKE_MATCH)

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
  if (criteria?.oidcClientId) where.oidcClientId = criteria.oidcClientId.toUpperCase()
  if (criteria?.contractId || criteria?.issuanceId) {
    relations.issuances = true
    const issuanceWhere: FindOptionsWhere<IssuanceEntity> = {}
    if (criteria.contractId) issuanceWhere.contractId = criteria.contractId.toUpperCase()
    if (criteria.issuanceId) issuanceWhere.id = criteria.issuanceId.toUpperCase()
    where.issuances = issuanceWhere
  }
  if (criteria?.partnerId) {
    relations.partners = true
    where.partners = { id: criteria.partnerId.toUpperCase() }
  }
  if (criteria?.requestedType) where.requestedCredentialsJson = ILike(`%"type":"${criteria.requestedType}"%`)
  if (criteria?.presentedType) where.presentedCredentialsJson = ILike(`%"type":[[]%"${criteria.presentedType}"%]%`) // [[] is how you escape [ https://stackoverflow.com/questions/439495/how-can-i-escape-square-brackets-in-a-like-clause

  if (criteria?.isFaceCheckRequested === true) where.requestedCredentialsJson = faceCheckRequested
  else if (criteria?.isFaceCheckRequested === false) where.requestedCredentialsJson = Not(faceCheckRequested)

  where.presentedAt = OptionalRange(criteria?.from, criteria?.to)

  const direction = orderDirection ?? OrderDirection.Asc
  switch (orderBy) {
    case PresentationOrderBy.IdentityName:
      relations.identity = true
      order.identity = { name: direction }
      break
    case PresentationOrderBy.PresentedAt:
      order.presentedAt = orderDirection ?? OrderDirection.Desc
      break
    case PresentationOrderBy.RequestedByName:
      relations.requestedBy = true
      order.requestedBy = { name: direction }
      break
    default:
      order.presentedAt = orderDirection ?? OrderDirection.Desc
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
