import type { Maybe } from '@graphql-tools/utils'
import { isNotNil } from '@makerx/graphql-core'
import type { FindOptionsOrder, FindOptionsWhere } from 'typeorm'
import { IsNull, Like, Not } from 'typeorm'
import type { QueryContext } from '../../../cqs'
import type { OidcClaimMappingWhere } from '../../../generated/graphql'
import { OidcClaimMappingOrderBy, OrderDirection } from '../../../generated/graphql'
import { OptionalRange } from '../../../util/typeorm'
import { OidcClaimMappingEntity } from '../entities/oidc-claim-mapping-entity'

export async function FindOidcClaimMappingsQuery(
  this: QueryContext,
  criteria?: Maybe<OidcClaimMappingWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
  orderBy?: Maybe<OidcClaimMappingOrderBy>,
  orderDirection?: Maybe<OrderDirection>,
): Promise<OidcClaimMappingEntity[]> {
  const where: FindOptionsWhere<OidcClaimMappingEntity> = {}
  const order: FindOptionsOrder<OidcClaimMappingEntity> = {}

  if (criteria?.name) where.name = Like(`%${criteria.name}%`)
  if (criteria?.credentialType) where.credentialTypesJson = Like(`%"${criteria.credentialType}"%`)
  if (isNotNil(criteria?.isDeleted)) where.deletedAt = criteria.isDeleted ? Not(IsNull()) : IsNull()
  if (criteria?.createdById) where.createdById = criteria.createdById
  where.createdAt = OptionalRange(criteria?.createdFrom, criteria?.createdTo)

  const direction = orderDirection ?? OrderDirection.Asc
  switch (orderBy) {
    case OidcClaimMappingOrderBy.Name:
      order.name = direction
      break
    case OidcClaimMappingOrderBy.CreatedAt:
      order.createdAt = direction
      break
    case OidcClaimMappingOrderBy.UpdatedAt:
      order.updatedAt = direction
      break
  }

  return this.entityManager.getRepository(OidcClaimMappingEntity).find({
    comment: 'FindOidcClaimMappingsQuery',
    where,
    skip: offset ?? undefined,
    take: limit ?? undefined,
    order,
    withDeleted: criteria?.isDeleted === true,
  })
}
