import { rule } from 'graphql-shield'
import type { ShieldRule } from 'graphql-shield/typings/types'
import { apiUrl } from '../config'
import type { GraphQLContext } from '../context'
import type { OidcScopes } from '../roles'

type Primitive = string | number | symbol | bigint | boolean | null | undefined
export type ShieldSchema<TResolver> = TResolver extends Primitive
  ? ShieldRule
  : {
      [key in keyof TResolver]?: ShieldSchema<TResolver[key]> | ShieldRule
    } & {
      '*'?: ShieldRule
    }

export function hasRoleRule(role: string, ruleName?: string) {
  const r = rule(ruleName ?? `hasRole-${role}`, { cache: 'contextual' })(
    (_, __, { user }: GraphQLContext) => user?.roles.includes(role) === true,
  )
  ;(r as any).__roles = [role]
  return r
}

export function hasAnyRoleRule(...roles: string[]) {
  return hasAnyRoleRuleWithName(`hasAnyRole-${roles.join(',')}`, ...roles)
}

export function hasAnyRoleRuleWithName(ruleName: string, ...roles: string[]) {
  const r = rule(ruleName, { cache: 'contextual' })((_, __, { user }: GraphQLContext) => {
    return user?.roles.some((role) => roles.includes(role)) === true
  })
  ;(r as any).__roles = roles
  return r
}

export function hasScopeRule(scope: string) {
  return rule(`hasScope-${scope}`, { cache: 'contextual' })((_, __, { user }: GraphQLContext) => user?.scopes.includes(scope) === true)
}

export function hasAnyScopeRule(...scopes: string[]) {
  return rule(`hasScope-${scopes.join(',')}`, { cache: 'contextual' })(
    (_, __, { user }: GraphQLContext) => user?.scopes.some((scope) => scopes.includes(scope)) === true,
  )
}

export function hasApiResourceScopeRule(scope: OidcScopes) {
  return rule(`hasApiResourceScope-${scope}`, { cache: 'contextual' })((_, __, { user }: GraphQLContext) => {
    if (!user) return false
    if (user.claims.aud !== apiUrl) return false
    return user.scopes.includes(scope)
  })
}
