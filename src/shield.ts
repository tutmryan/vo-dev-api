import { isDev, isLocalDev } from '@makerxstudio/node-common'
import { allow, rule, shield } from 'graphql-shield'
import type { GraphQLContext } from './context'

const isUser = rule({ cache: 'contextual' })(async (_parent, _args, { user }: GraphQLContext) => user?.scopes.includes('Admin') === true)

export const permissions = shield(
  {
    Query: {
      healthcheck: allow,
    },
  },
  {
    fallbackRule: isUser,
    debug: isLocalDev || isDev, // [doc](https://the-guild.dev/graphql/shield/docs/shield) says: _Toggle debug mode._ (???)
    allowExternalErrors: true, // we don't want shield to catch and convert all errors to: Not Authorised!
  },
)
