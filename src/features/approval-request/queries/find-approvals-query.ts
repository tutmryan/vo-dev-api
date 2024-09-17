import { ILike, IsNull, type FindOptionsOrder, type FindOptionsRelations, type FindOptionsWhere } from 'typeorm'
import type { QueryContext } from '../../../cqs'
import type { ApprovalRequestsWhere } from '../../../generated/graphql'
import { ApprovalRequestsOrderBy, ApprovalRequestStatus, OrderDirection, type Maybe } from '../../../generated/graphql'
import { LessThanOrEqualTimestamp, MoreThanOrEqualTimestamp, OptionalRange } from '../../../util/typeorm'
import { ApprovalRequestEntity } from '../entities/approval-request-entity'

export async function FindApprovalRequestsQuery(
  this: QueryContext,
  criteria?: Maybe<ApprovalRequestsWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
  orderBy?: Maybe<ApprovalRequestsOrderBy>,
  orderDirection?: Maybe<OrderDirection>,
) {
  const where: FindOptionsWhere<ApprovalRequestEntity> = {}
  const relations: FindOptionsRelations<ApprovalRequestEntity> = {}
  const order: FindOptionsOrder<ApprovalRequestEntity> = {}

  if (criteria?.requestedById) where.createdById = criteria.requestedById.toUpperCase()
  if (criteria?.requestType) where.requestType = criteria.requestType
  if (criteria?.requestedCredentialType) where.presentationRequestJson = ILike(`%"type":"${criteria.requestedCredentialType}"%`)
  if (criteria?.status === ApprovalRequestStatus.Approved) where.isApproved = true
  if (criteria?.status === ApprovalRequestStatus.Rejected) where.isApproved = false
  if (criteria?.status === ApprovalRequestStatus.Cancelled) where.isCancelled = true
  if (criteria?.status === ApprovalRequestStatus.Expired) {
    where.isApproved = IsNull()
    where.isCancelled = IsNull()
    where.expiresAt = LessThanOrEqualTimestamp(new Date())
  }
  if (criteria?.status === ApprovalRequestStatus.Pending) {
    where.isApproved = IsNull()
    where.isCancelled = IsNull()
    where.expiresAt = MoreThanOrEqualTimestamp(new Date())
  }

  where.createdAt = OptionalRange(criteria?.requestedFrom, criteria?.requestedTo)

  const direction = orderDirection ?? OrderDirection.Asc
  switch (orderBy) {
    case ApprovalRequestsOrderBy.RequestedAt:
      order.createdAt = direction
      break
    default:
      order.createdAt = orderDirection ?? OrderDirection.Desc
      break
  }

  const approvalRequests = await this.entityManager.getRepository(ApprovalRequestEntity).find({
    comment: 'FindApprovalRequestsQuery',
    where,
    relations,
    skip: offset ?? undefined,
    take: limit ?? undefined,
    order,
  })

  return approvalRequests
}
