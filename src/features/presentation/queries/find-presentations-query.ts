import type { FindOptionsOrder } from 'typeorm'
import { ILike, type FindOptionsRelations, type FindOptionsWhere } from 'typeorm'
import type { QueryContext } from '../../../cqrs/query-context'
import type { Maybe, PresentationWhere } from '../../../generated/graphql'
import { OrderDirection, PresentationOrderBy } from '../../../generated/graphql'
import { OptionalRange } from '../../../util/typeorm'
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
  if (criteria?.requestedType) where.requestedCredentialsJson = ILike(`%"type":"${criteria.requestedType}"%`)
  if (criteria?.presentedType) where.presentedCredentialsJson = ILike(`%"type":[%"${criteria.presentedType}"%]%`)

  where.presentedAt = OptionalRange(criteria?.from, criteria?.to)

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
