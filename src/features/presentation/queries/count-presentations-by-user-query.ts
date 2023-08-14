import type { QueryContext } from '../../../cqrs/query-context'
import type { Maybe, PresentationWhere } from '../../../generated/graphql'
import { PresentationEntity } from '../entities/presentation-entity'

export async function CountPresentationsByUserQuery(
  this: QueryContext,
  criteria?: Maybe<PresentationWhere>,
  offset?: Maybe<number>,
  limit?: Maybe<number>,
) {
  const {
    entityManager,
    dataLoaders: { users },
  } = this
  const query = entityManager
    .getRepository(PresentationEntity)
    .createQueryBuilder('p')
    .select('COUNT(*)', 'count')
    .addSelect('p.requested_by_id')
    .groupBy('p.requested_by_id')
    .orderBy('count', 'DESC')
    .where('1=1')
    .comment('CountPresentationsByUserQuery')

  if (offset) query.skip(offset)
  if (limit) query.take(limit)

  if (criteria?.requestId) query.andWhere('p.request_id = :requestId', { requestId: criteria.requestId.toUpperCase() })
  if (criteria?.identityId) query.andWhere('p.identity_id = :identityId', { identityId: criteria.identityId.toUpperCase() })
  if (criteria?.contractId) {
    query.innerJoin('presentation_issuances', 'pi', 'p.id = pi.presentation_id')
    query.innerJoin('issuance', 'i', 'pi.issuance_id = i.id')
    query.andWhere('contract_id = :contractId', { contractId: criteria.contractId.toUpperCase() })
  }
  if (criteria?.requestedById) throw new Error("Sorry, can't filter by requestedById when grouping by requested by user.")

  if (criteria?.from && criteria.to)
    query.andWhere('presented_at BETWEEN :from AND :to', { from: criteria.from.toISOString(), to: criteria.to.toISOString() })
  else if (criteria?.from) query.andWhere('presented_at >= :from', { from: criteria.from.toISOString() })
  else if (criteria?.to) query.andWhere('presented_at <= :to', { to: criteria.to.toISOString() })

  return query.getRawMany().then((rows) => rows.map((row) => ({ user: users.load(row.requested_by_id), count: row.count })))
}
