import type { QueryContext } from '../../../cqs'
import type { IssuerIdentifierFilter, Maybe } from '../../../generated/graphql'
import { IdentityEntity } from '../entities/identity-entity'

export async function IdentitiesByIdentifiersQuery(this: QueryContext, filters?: Maybe<IssuerIdentifierFilter[]>) {
  if (!filters) return []

  let queryBuilder = this.entityManager.getRepository(IdentityEntity).createQueryBuilder('identity')

  filters.forEach((filter, index) => {
    const args: { [key: string]: string } = {}
    args[`issuer${index}`] = filter.issuer
    args[`identifier${index}`] = filter.identifier

    queryBuilder = queryBuilder.orWhere(`(issuer = :issuer${index} AND identifier = :identifier${index})`, args)
  })

  const results = await queryBuilder.getMany()

  return filters.map(
    (filter) => results.find((result) => result.issuer === filter.issuer && result.identifier === filter.identifier) ?? null,
  )
}
