import { dispatch } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { AcquireLimitedAccessTokenCommand } from './commands/acquire-limited-access-token-command'

export const resolvers: Resolvers = {
  Mutation: {
    acquireLimitedAccessToken: async (_, { input }, context) => dispatch(context, AcquireLimitedAccessTokenCommand, input),
  },
}
