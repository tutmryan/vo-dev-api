import { isNotNil } from '@makerx/graphql-core'
import { IsNull, Like, Not, type FindOptionsOrder, type FindOptionsWhere } from 'typeorm'
import type { QueryContext } from '../../../cqs'
import type { Maybe, OidcClientWhere } from '../../../generated/graphql'
import { OidcClientOrderBy, OrderDirection } from '../../../generated/graphql'
import { OptionalRange } from '../../../util/typeorm'
import { OidcClientEntity } from '../entities/oidc-client-entity'

export async function FindOidcClientsQuery(
  this: QueryContext,
  criteria?: Maybe<OidcClientWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
  orderBy?: Maybe<OidcClientOrderBy>,
  orderDirection?: Maybe<OrderDirection>,
): Promise<OidcClientEntity[]> {
  const where: FindOptionsWhere<OidcClientEntity> = {}
  const order: FindOptionsOrder<OidcClientEntity> = {}

  if (criteria?.name) where.name = Like(`%${criteria.name}%`)
  if (criteria?.applicationType) where.applicationType = criteria.applicationType
  if (criteria?.clientType) where.clientType = criteria.clientType
  if (isNotNil(criteria?.allowAnyPartner)) where.allowAnyPartner = criteria.allowAnyPartner
  if (isNotNil(criteria?.isDeleted)) where.deletedAt = criteria.isDeleted ? Not(IsNull()) : IsNull()
  if (criteria?.createdById) where.createdById = criteria.createdById
  where.createdAt = OptionalRange(criteria?.createdFrom, criteria?.createdTo)

  const direction = orderDirection ?? !!orderBy ? OrderDirection.Asc : OrderDirection.Desc
  switch (orderBy) {
    case OidcClientOrderBy.Name:
      order.name = direction
      break
    case OidcClientOrderBy.CreatedAt:
      order.createdAt = direction
      break
    case OidcClientOrderBy.UpdatedAt:
      order.updatedAt = direction
      break
    default:
      order.createdAt = direction
  }

  return this.entityManager.getRepository(OidcClientEntity).find({
    comment: 'FindOidcClientsQuery',
    where,
    skip: offset ?? undefined,
    take: limit ?? undefined,
    order,
    withDeleted: criteria?.includeDeleted ?? criteria?.isDeleted ?? false,
  })
}
