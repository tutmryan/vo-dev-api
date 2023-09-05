import type { FindOperator, SelectQueryBuilder } from 'typeorm'
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm'

export const BetweenTimestamp = (from: Date, to: Date) => Between(from.toISOString(), to.toISOString()) as any as FindOperator<Date>
export const MoreThanOrEqualTimestamp = (date: Date) => MoreThanOrEqual(date.toISOString()) as any as FindOperator<Date>
export const LessThanOrEqualTimestamp = (date: Date) => LessThanOrEqual(date.toISOString()) as any as FindOperator<Date>

export const OptionalRange = (from?: Date | null, to?: Date | null) => {
  if (from && to) return BetweenTimestamp(from, to)
  if (from) return MoreThanOrEqualTimestamp(from)
  if (to) return LessThanOrEqualTimestamp(to)
  return undefined
}

export const andWhereOptionalRange = <E extends Record<string, any>>(
  query: SelectQueryBuilder<E>,
  field: string,
  from?: Date | null,
  to?: Date | null,
) => {
  const fromKey = `${field}From`
  const toKey = `${field}To`
  if (from && to) query.andWhere(`${field} BETWEEN :${fromKey} AND :${toKey}`, { [fromKey]: from.toISOString(), [toKey]: to.toISOString() })
  else if (from) query.andWhere(`${field} >= :${fromKey}`, { [fromKey]: from.toISOString() })
  else if (to) query.andWhere(`${field} <= :${toKey}`, { [toKey]: to.toISOString() })
}
