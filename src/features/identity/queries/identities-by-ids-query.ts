import { In } from 'typeorm'
import type { QueryContext } from '../../../cqs'
import type { Maybe } from '../../../generated/graphql'
import { IdentityEntity } from '../entities/identity-entity'

export async function IdentitiesByIdsQuery(this: QueryContext, ids?: Maybe<string[]>) {
  if (!ids) return []
  const results = await this.entityManager
    .getRepository(IdentityEntity)
    .find({ comment: 'IdentitiesById', where: { id: In(ids.map((id) => id)) } })

  return ids.map((id) => results.find((result) => result.id === id) ?? null)
}
