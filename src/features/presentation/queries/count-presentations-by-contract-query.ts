import type { QueryContext } from '../../../cqs'
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
    .from('presentation_issuances', null)
    .innerJoin('presentation', 'p', 'presentation_issuances.presentation_id = p.id')
    .innerJoin('issuance', 'i', 'presentation_issuances.issuance_id = i.id')
    .select('COUNT(*)', 'count')
    .addSelect('contract_id')
    .groupBy('contract_id')
    .orderBy('count', 'DESC')
    .where('1=1')
    .comment('CountPresentationsByContractQuery')

  if (offset) query.skip(offset)
  if (limit) query.take(limit)

  if (criteria?.requestId) query.andWhere('p.request_id = :requestId', { requestId: criteria.requestId.toUpperCase() })
  if (criteria?.identityId) query.andWhere('p.identity_id = :identityId', { identityId: criteria.identityId.toUpperCase() })
  if (criteria?.requestedById) query.andWhere('p.requested_by_id = :requestedById', { requestedById: criteria.requestedById.toUpperCase() })
  if (criteria?.contractId) throw new Error("Sorry, can't filter by contractId when grouping by contract.")
  if (criteria?.issuanceId) {
    query.innerJoin('presentation_issuances', 'pi', 'p.id = pi.presentation_id')
    query.innerJoin('issuance', 'i', 'pi.issuance_id = i.id')
    query.andWhere('issuance_id = :issuanceId', { issuanceId: criteria.issuanceId.toUpperCase() })
  }
  if (criteria?.partnerId) {
    query.innerJoin('presentation_partners', 'pp', 'p.id = pp.presentation_id')
    query.andWhere('partner_id = :partnerId', { partnerId: criteria.partnerId.toUpperCase() })
  }

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
