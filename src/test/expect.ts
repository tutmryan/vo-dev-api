import type { GraphQLFormattedError } from 'graphql'

export const expectUnauthorizedError = (errors?: readonly GraphQLFormattedError[]) => expect(errors?.[0]?.message).toBe('Not Authorised!')
export function expectToBeDefined(value: unknown): asserts value {
  expect(value).toBeDefined()
}
