import type { Maybe } from '@graphql-tools/utils'
import { isNotNil } from '@makerx/graphql-core'
import type { FindOptionsOrder, FindOptionsWhere } from 'typeorm'
import { IsNull, Like, Not } from 'typeorm'

import type { QueryContext } from '../../../cqs'
import type { OidcIdentityResolverWhere } from '../../../generated/graphql'
import { OidcIdentityResolverOrderBy, OrderDirection } from '../../../generated/graphql'
import { OptionalRange } from '../../../util/typeorm'
import { OidcIdentityResolverEntity } from '../entities/oidc-identity-resolver-entity'

export async function FindOidcIdentityResolversQuery(
  this: QueryContext,
  criteria?: Maybe<OidcIdentityResolverWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
  orderBy?: Maybe<OidcIdentityResolverOrderBy>,
  orderDirection?: Maybe<OrderDirection>,
): Promise<OidcIdentityResolverEntity[]> {
  const where: FindOptionsWhere<OidcIdentityResolverEntity> = {}
  const order: FindOptionsOrder<OidcIdentityResolverEntity> = {}

  if (criteria?.name) where.name = Like(`%${criteria.name}%`)
  if (criteria?.credentialType) where.credentialTypes = Like(`"${criteria.credentialType}"`)
  if (criteria?.identityStoreType) where.identityStoreType = criteria.identityStoreType
  if (criteria?.identityStoreId) where.identityStoreId = criteria.identityStoreId
  if (isNotNil(criteria?.isDeleted)) where.deletedAt = criteria.isDeleted ? Not(IsNull()) : IsNull()
  if (criteria?.createdById) where.createdById = criteria.createdById
  where.createdAt = OptionalRange(criteria?.createdFrom, criteria?.createdTo)

  const direction = orderDirection ?? OrderDirection.Asc
  switch (orderBy) {
    case OidcIdentityResolverOrderBy.Name:
      order.name = direction
      break
    case OidcIdentityResolverOrderBy.CreatedAt:
      order.createdAt = direction
      break
    case OidcIdentityResolverOrderBy.UpdatedAt:
      order.updatedAt = direction
      break
  }

  return this.entityManager.getRepository(OidcIdentityResolverEntity).find({
    comment: 'FindOidcIdentityResolversQuery',
    where,
    skip: offset ?? undefined,
    take: limit ?? undefined,
    order,
    withDeleted: criteria?.isDeleted === true,
  })
}
