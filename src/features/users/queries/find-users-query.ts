import type { FindOptionsOrder } from 'typeorm'
import { ILike, type FindOptionsRelations, type FindOptionsWhere } from 'typeorm'
import type { QueryContext } from '../../../cqrs/query-context'
import type { Maybe, UserWhere } from '../../../generated/graphql'
import { OrderDirection, UserOrderBy } from '../../../generated/graphql'
import { UserEntity } from '../entities/user-entity'

export async function FindUsersQuery(
  this: QueryContext,
  criteria?: Maybe<UserWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
  orderBy?: Maybe<UserOrderBy>,
  orderDirection?: Maybe<OrderDirection>,
) {
  const where: FindOptionsWhere<UserEntity> = {}
  const relations: FindOptionsRelations<UserEntity> = {}
  const order: FindOptionsOrder<UserEntity> = {}

  if (criteria?.name) where.name = ILike(`%${criteria.name}%`)
  if (criteria?.email) where.email = ILike(`%${criteria.email}%`)
  if (criteria?.isApp === true) where.isApp = true
  else if (criteria?.isApp === false) where.isApp = false

  const direction = orderDirection ?? OrderDirection.Asc
  switch (orderBy) {
    case UserOrderBy.Name:
      order.name = direction
      break
    case UserOrderBy.Email:
      order.email = direction
      break
    default:
      order.name = direction
      break
  }

  const presentations = await this.entityManager.getRepository(UserEntity).find({
    comment: 'FindUsersQuery',
    where,
    relations,
    skip: offset ?? undefined,
    take: limit ?? undefined,
    order,
  })

  return presentations
}
