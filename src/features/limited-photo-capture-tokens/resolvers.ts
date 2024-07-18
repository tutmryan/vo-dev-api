import { dispatch } from '../../cqs'
import type { Resolvers } from '../../generated/graphql'
import { AcquireLimitedPhotoCaptureTokenCommand } from './commands/acquire-limited-photo-capture-token-command'

export const resolvers: Resolvers = {
  Mutation: {
    acquireLimitedPhotoCaptureToken: async (_, { input }, context) => dispatch(context, AcquireLimitedPhotoCaptureTokenCommand, input),
  },
}
