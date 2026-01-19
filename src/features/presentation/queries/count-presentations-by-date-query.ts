import type { QueryContext } from '../../../cqs'
import type { Maybe, PresentationWhere } from '../../../generated/graphql'
import { PresentationEntity } from '../entities/presentation-entity'

export interface DateCount {
  date: string
  count: number
  contractId?: string
}

export async function CountPresentationsByDateQuery(this: QueryContext, criteria?: Maybe<PresentationWhere>): Promise<DateCount[]> {
  const { entityManager } = this

  const query = entityManager
    .getRepository(PresentationEntity)
    .createQueryBuilder('presentation')
    .select('CAST(presentation.presented_at AS DATE)', 'date')
    .addSelect('COUNT(*)', 'count')
    .groupBy('CAST(presentation.presented_at AS DATE)')
    .orderBy('date', 'ASC')
    .comment('CountPresentationsByDateQuery')

  if (criteria?.from) {
    query.andWhere('presentation.presented_at >= :fromDate', { fromDate: criteria.from.toISOString() })
  }

  if (criteria?.to) {
    query.andWhere('presentation.presented_at <= :toDate', { toDate: criteria.to.toISOString() })
  }

  if (criteria?.requestedById) {
    query.andWhere('presentation.requested_by_id = :requestedById', { requestedById: criteria.requestedById })
  }

  if (criteria?.contractId) {
    query.innerJoin('presentation_issuances', 'presentation_issuances', 'presentation_issuances.presentation_id = presentation.id')
    query.innerJoin('issuance', 'contract_issuance', 'contract_issuance.id = presentation_issuances.issuance_id')
    query.andWhere('contract_issuance.contract_id = :contractId', { contractId: criteria.contractId })
  }

  const results = await query.getRawMany()

  const normalized = results.map((row: { date: Date | string | null; count: string | number | null }) => ({
    date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date ?? ''),
    count: Number(row.count ?? 0),
  }))

  return normalized as DateCount[]
}
