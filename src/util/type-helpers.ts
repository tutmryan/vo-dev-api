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
