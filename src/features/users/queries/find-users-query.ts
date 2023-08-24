import { ILike, type FindOptionsRelations, type FindOptionsWhere } from 'typeorm'
import type { QueryContext } from '../../../cqrs/query-context'
import type { Maybe, UserWhere } from '../../../generated/graphql'
import { UserEntity } from '../entities/user-entity'

export async function FindUsersQuery(this: QueryContext, criteria?: Maybe<UserWhere>, offset?: Maybe<number>, limit?: Maybe<number>) {
  const where: FindOptionsWhere<UserEntity> = {}
  const relations: FindOptionsRelations<UserEntity> = {}

  if (criteria?.name) where.name = ILike(`%${criteria.name}%`)
  if (criteria?.email) where.email = ILike(`%${criteria.email}%`)
  if (criteria?.isApp === true) where.isApp = true
  else if (criteria?.isApp === false) where.isApp = false

  const presentations = await this.entityManager.getRepository(UserEntity).find({
    comment: 'FindUsersQuery',
    where,
    relations,
    skip: offset ?? undefined,
    take: limit ?? undefined,
  })

  return presentations
}
