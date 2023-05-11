import type { QueryContext } from '../../../cqrs/query-context'
import type { IssuanceWhere, Maybe } from '../../../generated/graphql'
import { IssuanceEntity } from '../entities/issuance-entity'

export async function CountIssuancesByContractQuery(
  this: QueryContext,
  criteria?: Maybe<IssuanceWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
) {
  const {
    entityManager,
    dataLoaders: { contracts },
  } = this
  const query = entityManager
    .getRepository(IssuanceEntity)
    .createQueryBuilder('issuance')
    .select('COUNT(*)', 'count')
    .addSelect('contract_id')
    .groupBy('contract_id')
    .orderBy('count', 'DESC')
    .where('1=1')

  if (offset) query.skip(offset)
  if (limit) query.take(limit)

  if (criteria?.identityId) query.andWhere('identity_id = :identityId', { identityId: criteria.identityId.toUpperCase() })
  if (criteria?.userId) query.andWhere('user_id = :userId', { userId: criteria.userId.toUpperCase() })
  if (criteria?.contractId) throw new Error("Sorry, can't filter by contractId when grouping by contract.")

  if (criteria?.from && criteria.to)
    query.andWhere('issued_at BETWEEN :from AND :to', { from: criteria.from.toISOString(), to: criteria.to.toISOString() })
  else if (criteria?.from) query.andWhere('issued_at >= :from', { from: criteria.from.toISOString() })
  else if (criteria?.to) query.andWhere('issued_at <= :to', { to: criteria.to.toISOString() })

  return query.getRawMany().then((rows) => rows.map((row) => ({ contract: contracts.load(row.contract_id), count: row.count })))
}
