import { GraphQLError } from 'graphql'
import { applySafeLimit, DEFAULT_QUERY_LIMIT, MAX_QUERY_LIMIT } from './typeorm'

describe('applySafeLimit', () => {
  it('should return DEFAULT_QUERY_LIMIT when no limit is provided', () => {
    expect(applySafeLimit(null)).toBe(DEFAULT_QUERY_LIMIT)
    expect(applySafeLimit(undefined)).toBe(DEFAULT_QUERY_LIMIT)
  })

  it('should return requested limit when under maximum', () => {
    expect(applySafeLimit(50)).toBe(50)
    expect(applySafeLimit(500)).toBe(500)
    expect(applySafeLimit(MAX_QUERY_LIMIT)).toBe(MAX_QUERY_LIMIT)
  })

  it('should throw GraphQLError when requested limit exceeds maximum', () => {
    expect(() => applySafeLimit(5000)).toThrow(GraphQLError)
    expect(() => applySafeLimit(10000)).toThrow(GraphQLError)
    expect(() => applySafeLimit(MAX_QUERY_LIMIT + 1)).toThrow(GraphQLError)

    try {
      applySafeLimit(5000)
      fail('Expected GraphQLError to be thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError)
      expect((error as GraphQLError).message).toBe('Limit exceeded')
      expect((error as GraphQLError).extensions).toEqual({
        code: 'LIMIT_EXCEEDED',
        requestedLimit: 5000,
        maxLimit: MAX_QUERY_LIMIT,
      })
    }
  })

  it('should return zero or negative values as-is', () => {
    expect(applySafeLimit(0)).toBe(0)
    expect(applySafeLimit(-1)).toBe(-1)
  })
})
