import { isDev, isLocalDev } from '@makerxstudio/node-common'
import { allow, chain, rule, shield } from 'graphql-shield'
import type { IRules, ShieldRule } from 'graphql-shield/typings/types'
import type { GraphQLContext } from './context'
import type { Resolvers } from './generated/graphql'

const isAdmin = rule({ cache: 'contextual' })(async (_parent, _args, { user }: GraphQLContext) => user?.scopes.includes('Admin') === true)
const canRequestIssuance = rule({ cache: 'contextual' })((_, __, { user }) => user?.roles.includes('VerifiableCredential.Issue'))
const canRequestPresentation = rule({ cache: 'contextual' })((_, __, { user }) => user?.roles.includes('VerifiableCredential.Present'))
const isAuthorized = chain(isAdmin, canRequestIssuance, canRequestPresentation)

export const permissions = wrappedShield({
  Query: {
    healthcheck: allow,
  },
})

function wrappedShield(x: ShieldSchema<Resolvers>) {
  return shield(x as IRules, {
    fallbackRule: isAuthorized,
    debug: isLocalDev || isDev, // [doc](https://the-guild.dev/graphql/shield/docs/shield) says: _Toggle debug mode._ (???)
    allowExternalErrors: true, // we don't want shield to catch and convert all errors to: Not Authorised!
  })
}

type Primitive = string | number | symbol | bigint | boolean | null | undefined
type ShieldSchema<TResolver> = TResolver extends Primitive
  ? ShieldRule
  : {
      [key in keyof TResolver]?: ShieldSchema<TResolver[key]> | ShieldRule
    } & {
      '*'?: ShieldRule
    }
