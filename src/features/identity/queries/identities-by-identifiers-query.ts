import type { QueryContext } from '../../../cqs'
import type { IssuerIdentifierInput, Maybe } from '../../../generated/graphql'
import { IdentityEntity } from '../entities/identity-entity'

export async function IdentitiesByIdentifiersQuery(this: QueryContext, filters?: Maybe<IssuerIdentifierInput[]>) {
  if (!filters) return []

  const results = await this.entityManager
    .getRepository(IdentityEntity)
    .find({ where: filters.map((filter) => ({ issuer: filter.issuer, identifier: filter.identifier })) })
  return filters.map(
    (filter) => results.find((result) => result.issuer === filter.issuer && result.identifier === filter.identifier) ?? null,
  )
}
