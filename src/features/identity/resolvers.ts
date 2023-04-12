import { dispatch, query } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { CreateOrUpdateIdentityCommand } from './commands/create-or-update-identity'
import { GetIdentityQuery } from './queries/get-identity-query'

export const resolvers: Resolvers = {
  Mutation: {
    saveIdentity: (_, { input }, context) => dispatch(context, CreateOrUpdateIdentityCommand, input),
  },
  Query: {
    identity: (_, { id }, context) => query(context, GetIdentityQuery, id),
  },
}
