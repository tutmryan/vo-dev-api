import type { FindOptionsWhere } from 'typeorm'
import { ILike } from 'typeorm'
import config from '../../../config'
import type { QueryContext } from '../../../cqrs/query-context'
import type { IdentityWhere, Maybe } from '../../../generated/graphql'
import { IdentityEntity } from '../entities/identity-entity'

export async function FindIdentitiesQuery(
  this: QueryContext,
  criteria?: Maybe<IdentityWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
) {
  const where: FindOptionsWhere<IdentityEntity> = {}

  if (criteria?.name) where.name = ILike(`%${criteria.name}%`)
  if (criteria?.issuer) {
    // look for the issuer by name in mapped config and use the key, if found
    const mappedKey = Object.entries(config.get('identityIssuers')).find(([, value]) => value.name === criteria.issuer)?.[0]
    where.issuer = ILike(`%${mappedKey ?? criteria.issuer}%`)
  }

  return await this.entityManager.getRepository(IdentityEntity).find({
    comment: 'FindIdentitiesQuery',
    where,
    skip: offset ?? undefined,
    take: limit ?? undefined,
    order: { name: { direction: 'ASC' } },
  })
}
