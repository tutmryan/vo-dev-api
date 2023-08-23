import { rule } from 'graphql-shield'
import type { ShieldRule } from 'graphql-shield/typings/types'
import type { GraphQLContext } from '../context'

type Primitive = string | number | symbol | bigint | boolean | null | undefined
export type ShieldSchema<TResolver> = TResolver extends Primitive
  ? ShieldRule
  : {
      [key in keyof TResolver]?: ShieldSchema<TResolver[key]> | ShieldRule
    } & {
      '*'?: ShieldRule
    }

export function hasRoleRule(role: string) {
  return rule(`hasRole-${role}`, { cache: 'contextual' })((_, __, { user }: GraphQLContext) => user?.roles.includes(role) === true)
}

export function hasAnyRoleRule(...roles: string[]) {
  return rule(`hasAnyRole-${roles.join(',')}`, { cache: 'contextual' })((_, __, { user }: GraphQLContext) => {
    return user?.roles.some((role) => roles.includes(role)) === true
  })
}

export function hasScopeRule(scope: string) {
  return rule(`hasScope-${scope}`, { cache: 'contextual' })((_, __, { user }: GraphQLContext) => user?.scopes.includes(scope) === true)
}

export function hasAnyScopeRule(...scopes: string[]) {
  return rule(`hasScope-${scopes.join(',')}`, { cache: 'contextual' })(
    (_, __, { user }: GraphQLContext) => user?.scopes.some((scope) => scopes.includes(scope)) === true,
  )
}
