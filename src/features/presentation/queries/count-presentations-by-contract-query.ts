import type { QueryContext } from '../../../cqrs/query-context'
import type { Maybe, PresentationWhere } from '../../../generated/graphql'

export async function CountPresentationsByContractQuery(
  this: QueryContext,
  criteria?: Maybe<PresentationWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
) {
  const {
    entityManager,
    dataLoaders: { contracts },
  } = this
  // this is a bit of a hack to use QueryBuilder without an entity (straight on the many-to-many table presentation_contracts)
  const query = (entityManager as any)
    .createQueryBuilder()
    .select()
    .from('presentation_contracts', null)
    .innerJoin('presentation', 'p', 'presentation_contracts.presentation_id = p.id')
    .select('COUNT(*)', 'count')
    .addSelect('contract_id')
    .groupBy('contract_id')
    .orderBy('count', 'DESC')
    .where('1=1')
    .comment('CountPresentationsByContractQuery')

  if (offset) query.skip(offset)
  if (limit) query.take(limit)

  if (criteria?.identityId) query.andWhere('p.identity_id = :identityId', { identityId: criteria.identityId.toUpperCase() })
  if (criteria?.contractId) query.andWhere('contract_id = :contractId', { contractId: criteria.contractId.toUpperCase() })
  if (criteria?.userId) throw new Error("Sorry, can't filter by userId when grouping by user.")

  if (criteria?.from && criteria.to)
    query.andWhere('p.presented_at BETWEEN :from AND :to', { from: criteria.from.toISOString(), to: criteria.to.toISOString() })
  else if (criteria?.from) query.andWhere('p.presented_at >= :from', { from: criteria.from.toISOString() })
  else if (criteria?.to) query.andWhere('p.presented_at <= :to', { to: criteria.to.toISOString() })

  return query
    .getRawMany()
    .then((rows: Array<{ contract_id: string; count: number }>) =>
      rows.map((row) => ({ contract: contracts.load(row.contract_id), count: row.count })),
    )
}
