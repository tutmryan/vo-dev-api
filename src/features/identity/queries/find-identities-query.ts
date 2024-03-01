import type { FindOptionsOrder, FindOptionsWhere } from 'typeorm'
import { ILike } from 'typeorm'
import type { QueryContext } from '../../../cqs'
import type { IdentityWhere, Maybe } from '../../../generated/graphql'
import { IdentityOrderBy, OrderDirection } from '../../../generated/graphql'
import { IdentityEntity } from '../entities/identity-entity'

export async function FindIdentitiesQuery(
  this: QueryContext,
  criteria?: Maybe<IdentityWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
  orderBy?: Maybe<IdentityOrderBy>,
  orderDirection?: Maybe<OrderDirection>,
) {
  const where: FindOptionsWhere<IdentityEntity> = {}
  const order: FindOptionsOrder<IdentityEntity> = {}

  if (criteria?.name) where.name = ILike(`%${criteria.name}%`)
  if (criteria?.issuer) where.issuer = ILike(`%${criteria.issuer}%`)

  const direction = orderDirection ?? OrderDirection.Asc
  switch (orderBy) {
    case IdentityOrderBy.Name:
      order.name = direction
      break
    case IdentityOrderBy.Identifier:
      order.identifier = direction
      break
    default:
      order.name = direction
      break
  }

  return await this.entityManager.getRepository(IdentityEntity).find({
    comment: 'FindIdentitiesQuery',
    where,
    skip: offset ?? undefined,
    take: limit ?? undefined,
    order,
  })
}
