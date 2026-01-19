import type { QueryContext } from '../../../cqs'
import type { IssuanceWhere, Maybe } from '../../../generated/graphql'
import { IssuanceEntity } from '../entities/issuance-entity'

export interface DateCount {
  date: string
  count: number
}

export async function CountIssuancesByDateQuery(this: QueryContext, criteria?: Maybe<IssuanceWhere>): Promise<DateCount[]> {
  const { entityManager } = this

  const query = entityManager
    .getRepository(IssuanceEntity)
    .createQueryBuilder('issuance')
    .select('CAST(issuance.issued_at AS DATE)', 'date')
    .addSelect('COUNT(*)', 'count')
    .groupBy('CAST(issuance.issued_at AS DATE)')
    .orderBy('date', 'ASC')
    .comment('CountIssuancesByDateQuery')

  if (criteria?.from) {
    query.andWhere('issuance.issued_at >= :fromDate', { fromDate: criteria.from.toISOString() })
  }

  if (criteria?.to) {
    query.andWhere('issuance.issued_at <= :toDate', { toDate: criteria.to.toISOString() })
  }

  if (criteria?.contractId) {
    query.andWhere('issuance.contract_id = :contractId', { contractId: criteria.contractId })
  }

  if (criteria?.issuedById) {
    query.andWhere('issuance.issued_by_id = :issuedById', { issuedById: criteria.issuedById })
  }

  const results = await query.getRawMany()

  const normalized = results.map((row: { date: Date | string | null; count: string | number | null }) => ({
    date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date ?? ''),
    count: Number(row.count ?? 0),
  }))

  return normalized as DateCount[]
}
