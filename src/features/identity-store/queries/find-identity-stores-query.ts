import type { Maybe } from '@graphql-tools/utils'
import { isNotNil } from '@makerx/graphql-core'
import type { FindOptionsOrder, FindOptionsWhere } from 'typeorm'
import { ILike, IsNull, Not } from 'typeorm'
import type { QueryContext } from '../../../cqs'
import type { IdentityStoreType, IdentityStoreWhere } from '../../../generated/graphql'
import { IdentityStoreOrderBy, OrderDirection } from '../../../generated/graphql'
import { IdentityStoreEntity } from '../entities/identity-store-entity'

export async function FindIdentityStoresQuery(
  this: QueryContext,
  criteria?: Maybe<IdentityStoreWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
  orderBy?: Maybe<IdentityStoreOrderBy>,
  orderDirection?: Maybe<OrderDirection>,
) {
  const repo = this.entityManager.getRepository(IdentityStoreEntity)

  const where: FindOptionsWhere<IdentityStoreEntity> = {}
  const order: FindOptionsOrder<IdentityStoreEntity> = {}

  if (criteria?.identifier) where.identifier = ILike(`%${criteria.identifier}%`)
  if (criteria?.name) where.name = ILike(`%${criteria.name}%`)
  if (criteria?.type) where.type = criteria.type as IdentityStoreType
  if (isNotNil(criteria?.isAuthenticationEnabled)) {
    where.isAuthenticationEnabled = criteria.isAuthenticationEnabled
  }

  if (isNotNil(criteria?.isDeleted)) where.deletedAt = criteria.isDeleted ? Not(IsNull()) : IsNull()

  const dir = orderDirection ?? OrderDirection.Asc
  switch (orderBy) {
    case IdentityStoreOrderBy.Identifier:
      order.identifier = dir
      break
    case IdentityStoreOrderBy.Name:
      order.name = dir
      break
    case IdentityStoreOrderBy.Type:
      order.type = dir
      break
    case IdentityStoreOrderBy.CreatedAt:
      order.createdAt = dir
      break
    default:
      order.createdAt = dir
  }

  return await repo.find({
    comment: 'FindIdentityStoresQuery',
    where: where,
    skip: offset ?? undefined,
    take: limit ?? undefined,
    order: order,
    withDeleted: criteria?.includeDeleted ?? criteria?.isDeleted ?? false,
  })
}
