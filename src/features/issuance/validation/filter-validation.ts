import type { InputMaybe } from '../../../generated/graphql'

export const MAX_FILTER_DEPTH = 3
export const MAX_CONDITION_COUNT = 20

/**
 * Validates that a filter does not exceed the maximum allowed depth.
 * @param filter The filter to validate
 * @param depth Current recursion depth (used internally)
 * @throws Error if filter depth exceeds MAX_FILTER_DEPTH
 */
export function validateFilterDepth(filter: InputMaybe<Filter>, depth = 0): void {
  if (depth >= MAX_FILTER_DEPTH) {
    throw new Error(`Filter depth limit of ${MAX_FILTER_DEPTH} exceeded. Please simplify your query.`)
  }

  if (filter?.AND) {
    filter.AND.forEach((f: Filter) => validateFilterDepth(f, depth + 1))
  }
  if (filter?.OR) {
    filter.OR.forEach((f: Filter) => validateFilterDepth(f, depth + 1))
  }
}

/**
 * Counts the total number of conditions in a filter (including nested conditions).
 * @param filter The filter to count conditions in
 * @returns The total number of conditions
 */
function countConditions(filter: any): number {
  if (!filter) return 0

  let count = 0

  // Count simple field filters (excluding AND/OR)
  Object.entries(filter).forEach(([key, value]) => {
    if (key !== 'AND' && key !== 'OR' && value != null) {
      count++
    }
  })

  // Recursively count AND conditions
  if (filter.AND) {
    filter.AND.forEach((f: Filter) => {
      count += countConditions(f)
    })
  }

  // Recursively count OR conditions
  if (filter.OR) {
    filter.OR.forEach((f: Filter) => {
      count += countConditions(f)
    })
  }

  return count
}

/**
 * Validates that a filter does not exceed the maximum allowed number of conditions.
 * @param filter The filter to validate
 * @throws Error if filter has more than MAX_CONDITION_COUNT conditions
 */
export function validateConditionCount(filter: Filter): void {
  const count = countConditions(filter)
  if (count > MAX_CONDITION_COUNT) {
    throw new Error(`Filter has ${count} conditions, which exceeds the maximum of ${MAX_CONDITION_COUNT}. Please simplify your query.`)
  }
}

type Filter = {
  AND?: InputMaybe<Filter[]>
  OR?: InputMaybe<Filter[]>
  [key: string]: any
}

/**
 * Validates a filter for both depth and condition count limits.
 * @param filter The filter to validate
 * @throws Error if filter exceeds depth or condition count limits
 */
export function validateFilter(filter: InputMaybe<Filter>): void {
  if (!filter) return

  validateFilterDepth(filter)
  validateConditionCount(filter)
}
