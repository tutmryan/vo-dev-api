import { dispatch, query } from '../../cqs'
import type { Resolvers } from '../../generated/graphql'
import { CreateOrUpdateConciergeBrandingCommand } from './commands/create-or-update-concierge-branding-command'
import { DeleteConciergeBrandingCommand } from './commands/delete-concierge-branding-command'
import { GetConciergeBrandingQuery } from './queries/get-concierge-branding-query'

export const resolvers: Resolvers = {
  Query: {
    conciergeBranding: async (_, __, context) => query(context, GetConciergeBrandingQuery),
  },
  Mutation: {
    saveConciergeBranding: async (_, { input }, context) => dispatch(context, CreateOrUpdateConciergeBrandingCommand, input),
    deleteConciergeBranding: (_, __, context) => dispatch(context, DeleteConciergeBrandingCommand),
  },
}
