import type { GraphQLFormattedError } from 'graphql'

export const expectUnauthorizedError = (errors?: readonly GraphQLFormattedError[]) => expect(errors?.[0]?.message).toBe('Not Authorized!')

export function expectToBeDefined<T>(arg: T): asserts arg is Exclude<T, undefined> {
  expect(arg).toBeDefined()
}

export function expectToBeDefinedAndNotNull<T>(arg: T): asserts arg is Exclude<Exclude<T, undefined>, null> {
  expect(arg).toBeDefined()
  expect(arg).not.toBeNull()
}

export function expectToBeUndefined(arg: unknown): asserts arg is undefined {
  expect(arg).toBeUndefined()
}

export function expectResponseUnionToBe<
  TData extends {
    __typename?: string
  },
  TTypeName extends TData['__typename'],
>(data: TData, type: TTypeName): asserts data is TData & { __typename: TTypeName } {
  expect(data.__typename).toBe(type)
}
