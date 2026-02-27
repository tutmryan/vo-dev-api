import { dispatch } from '../../cqs'
import type { Resolvers } from '../../generated/graphql'
import { AcquireLimitedPresentationFlowTokenCommand } from './commands/acquire-limited-presentation-flow-token-command'

export const resolvers: Resolvers = {
  Mutation: {
    acquireLimitedPresentationFlowToken: async (_, { input }, context) =>
      dispatch(context, AcquireLimitedPresentationFlowTokenCommand, input),
  },
}
