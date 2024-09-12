type Scalar = Date | number | string | boolean | undefined | null
type ScalarPropsInternal<T, TKey extends keyof T> = TKey extends any ? (T[TKey] extends Scalar ? TKey : never) : never
export type ScalarProps<T> = Pick<T, ScalarPropsInternal<T, keyof T>>

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

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
