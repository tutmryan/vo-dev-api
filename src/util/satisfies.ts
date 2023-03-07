/*
Returns a delegate that will check that the provided value (TValue) satisfies TConstraint without changing the underlying type.

This is an alternative to...

const value: TConstraint = {...}
or
const value = { ... } as TConstraint

...where the inferred type of value is lost.

This helper can be removed once typescript 4.9 introduces the satisfies operator.

See also: https://devblogs.microsoft.com/typescript/announcing-typescript-4-9-beta/#the-satisfies-operator
 */

export const satisfies =
  <TConstraint>() =>
  <TValue extends TConstraint>(value: TValue): TValue =>
    value
