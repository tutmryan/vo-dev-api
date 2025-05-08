import { dispatch } from '../../cqs'
import type { Resolvers } from '../../generated/graphql'
import { ImportCommand } from './commands/import'

export const resolvers: Resolvers = {
  Mutation: {
    import: async (_, { input }, context) => await dispatch(context, ImportCommand, input),
  },
}
