import { IsNull, Not, type FindOptionsOrder, type FindOptionsWhere } from 'typeorm'
import type { QueryContext } from '../../../cqs'
import type { PresentationFlowsWhere } from '../../../generated/graphql'
import { OrderDirection, PresentationFlowsOrderBy, PresentationFlowStatus, type Maybe } from '../../../generated/graphql'
import { LessThanOrEqualTimestamp, MoreThanOrEqualTimestamp, OptionalRange } from '../../../util/typeorm'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'

export async function FindPresentationFlowsQuery(
  this: QueryContext,
  criteria?: Maybe<PresentationFlowsWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
  orderBy?: Maybe<PresentationFlowsOrderBy>,
  orderDirection?: Maybe<OrderDirection>,
) {
  const where: FindOptionsWhere<PresentationFlowEntity> = {}
  const order: FindOptionsOrder<PresentationFlowEntity> = {}

  if (criteria?.createdById) where.createdById = criteria.createdById
  if (criteria?.identityId) where.identityId = criteria.identityId

  if (criteria?.status === PresentationFlowStatus.Cancelled) where.isCancelled = true
  if (criteria?.status === PresentationFlowStatus.Submitted) {
    where.isCancelled = IsNull()
    where.isSubmitted = true
    where.expiresAt = MoreThanOrEqualTimestamp(new Date())
  }
  if (criteria?.status === PresentationFlowStatus.PresentationVerified) {
    where.isCancelled = IsNull()
    where.isSubmitted = IsNull()
    where.presentationId = Not(IsNull())
    where.expiresAt = MoreThanOrEqualTimestamp(new Date())
  }

  if (criteria?.status === PresentationFlowStatus.Expired) {
    where.isCancelled = IsNull()
    where.isSubmitted = IsNull()
    where.expiresAt = LessThanOrEqualTimestamp(new Date())
  }
  if (criteria?.status === PresentationFlowStatus.Pending) {
    where.isCancelled = IsNull()
    where.isSubmitted = IsNull()
    where.presentationId = IsNull()
    where.isRequestCreated = IsNull()
    where.isRequestRetrieved = IsNull()
    where.expiresAt = MoreThanOrEqualTimestamp(new Date())
  }
  if (criteria?.status === PresentationFlowStatus.RequestCreated) {
    where.isCancelled = IsNull()
    where.isSubmitted = IsNull()
    where.presentationId = IsNull()
    where.isRequestCreated = true
    where.isRequestRetrieved = IsNull()
    where.expiresAt = MoreThanOrEqualTimestamp(new Date())
  }
  if (criteria?.status === PresentationFlowStatus.RequestRetrieved) {
    where.isCancelled = IsNull()
    where.isSubmitted = IsNull()
    where.presentationId = IsNull()
    where.isRequestRetrieved = true
    where.expiresAt = MoreThanOrEqualTimestamp(new Date())
  }
  if (criteria?.incomplete) {
    where.isCancelled = IsNull()
    where.isSubmitted = IsNull()
    where.expiresAt = MoreThanOrEqualTimestamp(new Date())
  }

  where.createdAt = OptionalRange(criteria?.createdFrom, criteria?.createdTo)

  const direction = orderDirection ?? OrderDirection.Asc
  switch (orderBy) {
    case PresentationFlowsOrderBy.CreatedAt:
      order.createdAt = direction
      break
    default:
      order.createdAt = orderDirection ?? OrderDirection.Desc
      break
  }

  return await this.entityManager.getRepository(PresentationFlowEntity).find({
    comment: 'FindPresentationFlowsQuery',
    where,
    skip: offset ?? undefined,
    take: limit ?? undefined,
    order,
  })
}
