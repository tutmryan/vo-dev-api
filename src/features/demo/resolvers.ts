import { dispatch } from '../../cqs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { BeginOnboardingCommand } from './commands/begin-onboarding-command'

export const resolvers: Resolvers = {
  Mutation: {
    beginOnboarding: async (_, { input }, context) => dispatch(context, BeginOnboardingCommand, input),
  },
}
