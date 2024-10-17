type Scalar = Date | number | string | boolean | undefined | null
type ScalarPropsInternal<T, TKey extends keyof T> = TKey extends any ? (T[TKey] extends Scalar ? TKey : never) : never
export type ScalarProps<T> = Pick<T, ScalarPropsInternal<T, keyof T>>

export const resolveToType = <T>(value: T) => value

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends Readonly<infer U>[]
      ? Readonly<DeepPartial<U>>[]
      : DeepPartial<T[P]>
}

export type Nullable<T> = T | null | undefined

export type AwaitedReturnTypeOf<Service, Method extends keyof Service> = Awaited<
  ReturnType<Service[Method] extends (...args: any) => any ? Service[Method] : never>
>

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>
}

export function assertExhaustive(value: never, message?: string): never {
  throw new Error(message ?? `Reached unexpected case ${value} in exhaustive switch`)
}

export function isObject(x: unknown): x is object {
  return typeof x === 'object' && x !== null
}

export type NonEmptyArray<T> = [T, ...T[]]

export const NotFalsy = <T>(value: T): value is Exclude<T, 0 | '' | false | undefined | null> => Boolean(value)
