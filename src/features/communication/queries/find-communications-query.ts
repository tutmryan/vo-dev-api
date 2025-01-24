import type { FindOptionsOrder, FindOptionsRelations, FindOptionsWhere } from 'typeorm'
import { IsNull, Not } from 'typeorm'
import type { QueryContext } from '../../../cqs'
import type { Maybe } from '../../../generated/graphql'
import { CommunicationOrderBy, OrderDirection, type CommunicationWhere } from '../../../generated/graphql'
import { assertExhaustive } from '../../../util/type-helpers'
import { OptionalRange } from '../../../util/typeorm'
import { CommunicationEntity } from '../entities/communication-entity'

export async function FindCommunicationsQuery(
  this: QueryContext,
  criteria?: Maybe<CommunicationWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
  orderBy?: Maybe<CommunicationOrderBy>,
  orderDirection?: Maybe<OrderDirection>,
) {
  const where: FindOptionsWhere<CommunicationEntity> = {}
  const relations: FindOptionsRelations<CommunicationEntity> = {}
  const order: FindOptionsOrder<CommunicationEntity> = {}

  if (criteria?.recipientId) where.recipientId = criteria.recipientId
  if (criteria?.createdById) where.createdById = criteria.createdById
  if (criteria?.asyncIssuanceRequestId) where.asyncIssuanceId = criteria.asyncIssuanceRequestId
  if (criteria?.contactMethod) where.contactMethod = criteria.contactMethod
  if (criteria?.purpose) where.purpose = criteria.purpose
  if (criteria?.status) where.error = criteria.status === 'sent' ? IsNull() : Not(IsNull())

  where.sentAt = OptionalRange(criteria?.sentFrom, criteria?.sentTo)

  // default order by sent
  orderBy = orderBy ?? CommunicationOrderBy.SentAt

  // default order direction to desc if orderBy is sentAt and not filtered to a single async issuance
  const direction =
    orderDirection ?? (orderBy === CommunicationOrderBy.SentAt && !criteria?.asyncIssuanceRequestId)
      ? OrderDirection.Desc
      : OrderDirection.Asc

  switch (orderBy) {
    case CommunicationOrderBy.RecipientName:
      relations.recipient = true
      order.recipient = { name: direction }
      break
    case CommunicationOrderBy.SentAt:
      order.sentAt = direction
      break
    default:
      assertExhaustive(orderBy)
  }

  const communications = await this.entityManager.getRepository(CommunicationEntity).find({
    comment: 'FindCommunicationsQuery',
    where: where,
    relations,
    skip: offset ?? undefined,
    take: limit ?? undefined,
    order,
  })

  return communications
}
