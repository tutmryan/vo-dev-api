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
  if (criteria?.identityStoreId) {
    qb.andWhere('i.identity_store_id = :identityStoreId', { identityStoreId: criteria.identityStoreId })
  }
  if (criteria?.isDeletable != null) {
    const op = criteria.isDeletable ? 'NOT EXISTS' : 'EXISTS'
    const joiner = criteria.isDeletable ? 'AND' : 'OR'
    qb.andWhere(`
      ${op} (SELECT 1 FROM issuance iss WHERE iss.identity_id = i.id)
      ${joiner} ${op} (SELECT 1 FROM async_issuance async WHERE async.identity_id = i.id)
      ${joiner} ${op} (SELECT 1 FROM presentation p WHERE p.identity_id = i.id)
    `)
  }
  if (criteria?.walletId) {
    qb.andWhere(
      `EXISTS (
    SELECT 1 FROM presentation p
    WHERE p.identity_id = i.id
    AND LOWER(p.wallet_id) = LOWER(:walletId)
  )`,
      { walletId: criteria.walletId },
    )
  }

  const direction = orderDirection ?? OrderDirection.Asc
  const orderColumn = orderBy === IdentityOrderBy.Identifier ? 'i.identifier' : orderBy === IdentityOrderBy.Name ? 'i.name' : 'i.name'
  qb.orderBy(orderColumn, direction)

  return qb.getMany()
}
