// eslint-disable-next-line no-restricted-imports
import config from 'config'
import type { Config } from './schema'

type ExtractValue<TKey, TConfig> = TKey extends keyof TConfig
  ? TConfig[TKey]
  : TKey extends `${infer TFirst}.${infer TRest}`
  ? TFirst extends keyof TConfig
    ? ExtractValue<TRest, TConfig[TFirst]>
    : never
  : never

export type TypedConfig<TConfig extends object> = {
  get<TPath extends Paths<TConfig>>(path: TPath): ExtractValue<TPath, TConfig>
  has<TPath extends Paths<TConfig>>(path: TPath): boolean
}

export const typedConfig: TypedConfig<Config> = config

type Join<K, P> = K extends string | number ? (P extends string | number ? `${K}${'' extends P ? '' : '.'}${P}` : never) : never
type Paths<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
  ? {
      [K in keyof T]-?: K extends string | number ? `${K}` | (Paths<T[K], Prev[D]> extends infer R ? Join<K, R> : never) : never
    }[keyof T]
  : ''

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]]
