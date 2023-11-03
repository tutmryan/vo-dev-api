import type { GraphQLFormattedError } from 'graphql'

export const expectUnauthorizedError = (errors?: readonly GraphQLFormattedError[]) => expect(errors?.[0]?.message).toBe('Not Authorized!')
export function expectToBeDefined(value: unknown): asserts value {
  expect(value).toBeDefined()
}
