import { type FindOptionsOrder, type FindOptionsRelations, type FindOptionsWhere } from 'typeorm'
import type { QueryContext } from '../../../cqs'
import type { ApprovalRequestsWhere } from '../../../generated/graphql'
import { ApprovalRequestsOrderBy, OrderDirection, type Maybe } from '../../../generated/graphql'
import type { PresentationRequest } from '../../../services/verified-id/request'
import { OptionalRange } from '../../../util/typeorm'
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

  return approvalRequests.filter((request) => {
    const presentationRequest = request.presentationRequest as PresentationRequest
    const matchesStatus = criteria?.status ? request.status === criteria.status : true
    const matchesCredential = criteria?.requestedCredential
      ? presentationRequest.requestedCredentials.some((credential) => credential.type === criteria.requestedCredential)
      : true
    return matchesStatus && matchesCredential
  })
}
