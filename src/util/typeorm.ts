import { GraphQLError } from 'graphql'
import type { FindOperator, SelectQueryBuilder } from 'typeorm'
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm'

/**
 * Default limit for queries when no limit is specified.
 * This prevents unbounded queries that could return massive result sets.
 */
export const DEFAULT_QUERY_LIMIT = 100

/**
 * Maximum limit for queries.
 * This prevents queries from requesting or returning more than this number of records,
 * protecting against database overload and GraphQL response size limits.
 */
export const MAX_QUERY_LIMIT = 1000

/**
 * Applies safe limit enforcement to prevent unbounded queries.
 * Defaults to DEFAULT_QUERY_LIMIT when no limit is specified.
 * Throws an error when the requested limit exceeds the maximum.
 *
 * @param requestedLimit - The limit requested by the caller (may be null/undefined)
 * @returns The requested limit if within bounds, otherwise DEFAULT_QUERY_LIMIT (100)
 * @throws {GraphQLError} When requestedLimit exceeds MAX_QUERY_LIMIT (1000)
 *
 * @example
 * ```typescript
 * applySafeLimit(null)  // → 100 (no limit specified)
 * applySafeLimit(50)    // → 50 (within bounds)
 * applySafeLimit(5000)  // → throws GraphQLError (exceeds maximum)
 * ```
 */
export function applySafeLimit(requestedLimit?: number | null): number {
  if (requestedLimit == null) {
    return DEFAULT_QUERY_LIMIT
  }

  if (requestedLimit > MAX_QUERY_LIMIT) {
    throw new GraphQLError(`Limit exceeded`, {
      extensions: {
        code: 'LIMIT_EXCEEDED',
        requestedLimit,
        maxLimit: MAX_QUERY_LIMIT,
      },
    })
  }

  return requestedLimit
}

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
