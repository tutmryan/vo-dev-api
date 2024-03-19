import { dispatch } from '../../cqs'
import type { Resolvers } from '../../generated/graphql'
import { AcquireLimitedApprovalTokenCommand } from './commands/acquire-limited-approval-token-command'

export const resolvers: Resolvers = {
  Mutation: {
    acquireLimitedApprovalToken: async (_, { input }, context) => dispatch(context, AcquireLimitedApprovalTokenCommand, input),
  },
}
