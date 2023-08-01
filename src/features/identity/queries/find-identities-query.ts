import type { FindOptionsWhere } from 'typeorm'
import { ILike } from 'typeorm'
import type { QueryContext } from '../../../cqrs/query-context'
import type { IdentityWhere, Maybe } from '../../../generated/graphql'
import { IdentityEntity } from '../entities/identity-entity'

export async function FindIdentitiesQuery(
  this: QueryContext,
  criteria?: Maybe<IdentityWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
) {
  if (!criteria?.name) return []

  const where: FindOptionsWhere<IdentityEntity> = {}

  if (criteria.name) where.name = ILike(`%${criteria.name}%`)

  return await this.entityManager.getRepository(IdentityEntity).find({
    comment: 'FindIdentitiesQuery',
    where,
    skip: offset ?? undefined,
    take: limit ?? undefined,
  })
}
