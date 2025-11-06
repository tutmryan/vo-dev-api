import type { ApolloServerPlugin } from '@apollo/server'
import { NoSchemaIntrospectionCustomRule, validate } from 'graphql'
import type { GraphQLContext } from './context'

export const authenticatedIntrospectionPlugin: ApolloServerPlugin<GraphQLContext> = {
  requestDidStart: async () => ({
    didResolveOperation: async ({ schema, document, contextValue }) => {
      if (!contextValue.user) {
        const errors = validate(schema, document, [NoSchemaIntrospectionCustomRule])
        if (errors.length) throw errors[0]
      }
    },
  }),
}
