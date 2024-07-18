import type { GraphQLFormattedError } from 'graphql'

export const expectUnauthorizedError = (errors?: readonly GraphQLFormattedError[]) => expect(errors?.[0]?.message).toBe('Not Authorized!')

export function expectToBeDefined<T extends object>(value: T | null | undefined): NonNullable<T> {
  expect(value).toBeDefined()
  return value as T
}
