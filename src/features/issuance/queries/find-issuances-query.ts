import type { QueryContext } from '../../../cqs'
import { IssuanceOrderBy, OrderDirection, type IssuanceWhere, type Maybe } from '../../../generated/graphql'
import { IssuanceEntity } from '../entities/issuance-entity'
import { validateFilter } from '../validation/filter-validation'
import { applyWhereClause } from './where-builder'

export async function FindIssuancesQuery(
  this: QueryContext,
  criteria?: Maybe<IssuanceWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
  orderBy?: Maybe<IssuanceOrderBy>,
  orderDirection?: Maybe<OrderDirection>,
) {
  // Validate filter depth and condition count
  validateFilter(criteria)

  // Create query builder
  const qb = this.entityManager.getRepository(IssuanceEntity).createQueryBuilder('issuance').comment('FindIssuancesQuery')

  // Set up joins if needed (must be done before applying where clause)
  if (criteria?.identityStoreId) {
    qb.leftJoin('issuance.identity', 'identity')
  }
  if (criteria?.presentationId) {
    qb.leftJoin('issuance.presentations', 'presentation')
  }

  // Apply WHERE clause recursively
  if (criteria) {
    applyWhereClause(qb, criteria)
  }

  // Apply ordering
  const direction = orderDirection ?? OrderDirection.Asc
  switch (orderBy) {
    case IssuanceOrderBy.ContractName:
      qb.leftJoinAndSelect('issuance.contract', 'contract')
      qb.orderBy('contract.name', direction)
      break
    case IssuanceOrderBy.ExpiresAt:
      qb.orderBy('issuance.expiresAt', direction)
      break
    case IssuanceOrderBy.IdentityName:
      qb.leftJoinAndSelect('issuance.identity', 'identity')
      qb.orderBy('identity.name', direction)
      break
    case IssuanceOrderBy.IssuedAt:
      qb.orderBy('issuance.issuedAt', orderDirection ?? OrderDirection.Desc)
      break
    case IssuanceOrderBy.IssuedByName:
      qb.leftJoinAndSelect('issuance.issuedBy', 'issuedBy')
      qb.orderBy('issuedBy.name', direction)
      break
    default:
      qb.orderBy('issuance.issuedAt', orderDirection ?? OrderDirection.Desc)
      break
  }

  // Apply pagination
  if (offset !== null && offset !== undefined) {
    qb.skip(offset)
  }
  if (limit !== null && limit !== undefined) {
    qb.take(limit)
  }

  const issuances = await qb.getMany()

  return issuances
}
