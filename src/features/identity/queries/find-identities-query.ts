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
  const qb = this.entityManager.getRepository(IdentityEntity).createQueryBuilder('i').comment('FindIdentitiesQuery')
  if (offset) qb.skip(offset)
  if (limit) qb.take(limit)

  if (criteria?.name) {
    qb.andWhere('LOWER(i.name) LIKE LOWER(:name)', { name: `%${criteria.name}%` })
  }
  if (criteria?.issuer) {
    qb.andWhere('LOWER(i.issuer) LIKE LOWER(:issuer)', { issuer: `%${criteria.issuer}%` })
  }
  if (criteria?.isDeletable) {
    qb.andWhere(`
      NOT EXISTS (SELECT 1 FROM issuance iss WHERE iss.identity_id = i.id)
      AND NOT EXISTS (SELECT 1 FROM async_issuance async WHERE async.identity_id = i.id)
      AND NOT EXISTS (SELECT 1 FROM presentation p WHERE p.identity_id = i.id)
    `)
  }

  const direction = orderDirection ?? OrderDirection.Asc
  const orderColumn = orderBy === IdentityOrderBy.Identifier ? 'i.identifier' : orderBy === IdentityOrderBy.Name ? 'i.name' : 'i.name'
  qb.orderBy(orderColumn, direction)

  return qb.getMany()
}
