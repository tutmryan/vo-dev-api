import type { QueryContext } from '../../../cqrs/query-context'
import type { IssuanceWhere, Maybe } from '../../../generated/graphql'
import { IssuanceEntity } from '../entities/issuance-entity'

export async function CountIssuancesByUserQuery(
  this: QueryContext,
  criteria?: Maybe<IssuanceWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
) {
  const {
    entityManager,
    dataLoaders: { users },
  } = this
  const query = entityManager
    .getRepository(IssuanceEntity)
    .createQueryBuilder('issuance')
    .select('COUNT(*)', 'count')
    .addSelect('user_id')
    .groupBy('user_id')
    .orderBy('count', 'DESC')
    .where('1=1')
    .comment('CountIssuancesByUserQuery')

  if (offset) query.skip(offset)
  if (limit) query.take(limit)

  if (criteria?.requestId) query.andWhere('request_id = :requestId', { identityId: criteria.requestId.toUpperCase() })
  if (criteria?.identityId) query.andWhere('identity_id = :identityId', { identityId: criteria.identityId.toUpperCase() })
  if (criteria?.contractId) query.andWhere('contract_id = :contractId', { contractId: criteria.contractId.toUpperCase() })
  if (criteria?.issuedById) throw new Error("Sorry, can't filter by issuedById when grouping by issued by user.")

  if (criteria?.from && criteria.to)
    query.andWhere('issued_at BETWEEN :from AND :to', { from: criteria.from.toISOString(), to: criteria.to.toISOString() })
  else if (criteria?.from) query.andWhere('issued_at >= :from', { from: criteria.from.toISOString() })
  else if (criteria?.to) query.andWhere('issued_at <= :to', { to: criteria.to.toISOString() })

  return query.getRawMany().then((rows) => rows.map((row) => ({ user: users.load(row.user_id), count: row.count })))
}
