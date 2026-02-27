import type { ApolloServerPlugin } from '@apollo/server'
import { GraphQLError, NoSchemaIntrospectionCustomRule, validate } from 'graphql'
import type { GraphQLContext } from './context'
import { UserRoles } from './roles'

export const authenticatedIntrospectionPlugin: ApolloServerPlugin<GraphQLContext> = {
  requestDidStart: async () => ({
    didResolveOperation: async ({ schema, document, contextValue }) => {
      const errors = validate(schema, document, [NoSchemaIntrospectionCustomRule])
      if (!errors.length) return // Not an introspection query

      // Introspection requires authentication
      if (!contextValue.user) {
        throw errors[0]
      }

      // Introspection requires tools.apiExplorer.access role
      const userRoles = contextValue.user.roles
      if (!userRoles.includes(UserRoles.toolsAPIExplorerAccess)) {
        throw new GraphQLError('Introspection is disabled. You need the tools.apiExplorer.access role to use Apollo Studio.', {
          extensions: { code: 'FORBIDDEN' },
        })
      }
    },
  }),
}
