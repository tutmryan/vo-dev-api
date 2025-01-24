import { type FindOptionsOrder, type FindOptionsRelations, type FindOptionsWhere } from 'typeorm'
import { In } from 'typeorm/find-options/operator/In'
import type { QueryContext } from '../../../cqs'
import {
  AsyncIssuanceRequestsOrderBy,
  AsyncIssuanceRequestStatus,
  type AsyncIssuanceRequestsWhere,
  type Maybe,
  OrderDirection,
} from '../../../generated/graphql'
import { assertExhaustive } from '../../../util/type-helpers'
import { LessThanOrEqualTimestamp, MoreThanOrEqualTimestamp, OptionalRange } from '../../../util/typeorm'
import { AsyncIssuanceEntity, failedStates } from '../entities/async-issuance-entity'

export async function FindAsyncIssuancesQuery(
  this: QueryContext,
  criteria?: Maybe<AsyncIssuanceRequestsWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
  orderBy?: Maybe<AsyncIssuanceRequestsOrderBy>,
  orderDirection?: Maybe<OrderDirection>,
) {
  const where: FindOptionsWhere<AsyncIssuanceEntity> = {}
  const relations: FindOptionsRelations<AsyncIssuanceEntity> = {}
  const order: FindOptionsOrder<AsyncIssuanceEntity> = {}

  if (criteria?.status) {
    switch (criteria.status) {
      case AsyncIssuanceRequestStatus.Pending:
        where.state = In(['pending', 'contacted'])
        where.expiresOn = MoreThanOrEqualTimestamp(new Date())
        break
      case AsyncIssuanceRequestStatus.Expired:
        where.expiresOn = LessThanOrEqualTimestamp(new Date())
        break
      case AsyncIssuanceRequestStatus.Failed:
        where.state = In(failedStates)
        break
      case AsyncIssuanceRequestStatus.Issued:
        where.state = 'issued'
        break
      case AsyncIssuanceRequestStatus.Cancelled:
        where.state = 'cancelled'
        break
      default:
        assertExhaustive(criteria.status) // a type error here means a missing case in the switch
    }
  }

  if (criteria?.identityId) where.identityId = criteria.identityId
  if (criteria?.contractId) where.contractId = criteria.contractId
  if (criteria?.createdById) where.createdById = criteria.createdById

  where.createdAt = OptionalRange(criteria?.createdFrom, criteria?.createdTo)

  const direction = orderDirection ?? OrderDirection.Asc
  switch (orderBy) {
    case AsyncIssuanceRequestsOrderBy.CreatedAt:
      order.createdAt = direction
      break
    default:
      order.createdAt = orderDirection ?? OrderDirection.Desc
      break
  }

  const asyncIssuances = await this.entityManager.getRepository(AsyncIssuanceEntity).find({
    comment: 'FindAsyncIssuancesQuery',
    where,
    relations,
    skip: offset ?? undefined,
    take: limit ?? undefined,
    order,
  })

  return asyncIssuances
}
