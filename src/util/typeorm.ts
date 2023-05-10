import type { FindOperator } from 'typeorm'
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm'

export const BetweenTimestamp = (from: Date, to: Date) => Between(from.toISOString(), to.toISOString()) as any as FindOperator<Date>
export const MoreThanOrEqualTimestamp = (date: Date) => MoreThanOrEqual(date.toISOString()) as any as FindOperator<Date>
export const LessThanOrEqualTimestamp = (date: Date) => LessThanOrEqual(date.toISOString()) as any as FindOperator<Date>
