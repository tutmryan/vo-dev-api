import type { Maybe } from '@graphql-tools/utils'
import { isNotNil } from '@makerx/graphql-core'
import type { FindOptionsOrder, FindOptionsWhere } from 'typeorm'
import { IsNull, Like, Not } from 'typeorm'
import type { QueryContext } from '../../../cqs'
import type { OidcResourceWhere } from '../../../generated/graphql'
import { OidcResourceOrderBy, OrderDirection } from '../../../generated/graphql'
import { OptionalRange } from '../../../util/typeorm'
import { OidcResourceEntity } from '../entities/oidc-resource-entity'

export async function FindOidcResourcesQuery(
  this: QueryContext,
  criteria?: Maybe<OidcResourceWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
  orderBy?: Maybe<OidcResourceOrderBy>,
  orderDirection?: Maybe<OrderDirection>,
): Promise<OidcResourceEntity[]> {
  const where: FindOptionsWhere<OidcResourceEntity> = {}
  const order: FindOptionsOrder<OidcResourceEntity> = {}

  if (criteria?.name) where.name = Like(`%${criteria.name}%`)
  if (criteria?.resourceIndicator) where.resourceIndicator = Like(`%${criteria.resourceIndicator}%`)
  if (isNotNil(criteria?.isDeleted)) where.deletedAt = criteria.isDeleted ? Not(IsNull()) : IsNull()
  if (criteria?.createdById) where.createdById = criteria.createdById
  where.createdAt = OptionalRange(criteria?.createdFrom, criteria?.createdTo)

  const direction = orderDirection ?? OrderDirection.Asc
  switch (orderBy) {
    case OidcResourceOrderBy.Name:
      order.name = direction
      break
    case OidcResourceOrderBy.CreatedAt:
      order.createdAt = direction
      break
    case OidcResourceOrderBy.UpdatedAt:
      order.updatedAt = direction
      break
  }

  return this.entityManager.getRepository(OidcResourceEntity).find({
    comment: 'FindOidcResourcesQuery',
    where,
    skip: offset ?? undefined,
    take: limit ?? undefined,
    order,
    withDeleted: criteria?.isDeleted === true,
  })
}
