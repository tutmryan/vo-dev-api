import { dispatch, query } from '../../cqs'
import type { Resolvers } from '../../generated/graphql'
import { CreateOrUpdateBrandingCommand } from './commands/create-or-update-branding-command'
import { DeleteBrandingCommand } from './commands/delete-branding-command'
import { COMPOSER_BRANDING_NAME, CONCIERGE_BRANDING_NAME } from './constants'
import { GetBrandingQuery } from './queries/get-branding-query'

export const resolvers: Resolvers = {
  Query: {
    conciergeBranding: async (_, __, context) => query(context, GetBrandingQuery, CONCIERGE_BRANDING_NAME),
    composerBranding: async (_, __, context) => query(context, GetBrandingQuery, COMPOSER_BRANDING_NAME),
  },
  Mutation: {
    saveConciergeBranding: async (_, { input }, context) =>
      dispatch(context, CreateOrUpdateBrandingCommand, CONCIERGE_BRANDING_NAME, input),
    deleteConciergeBranding: async (_, __, context) => dispatch(context, DeleteBrandingCommand, CONCIERGE_BRANDING_NAME),
    saveComposerBranding: async (_, { input }, context) => dispatch(context, CreateOrUpdateBrandingCommand, COMPOSER_BRANDING_NAME, input),
    deleteComposerBranding: async (_, __, context) => dispatch(context, DeleteBrandingCommand, COMPOSER_BRANDING_NAME),
  },
}
