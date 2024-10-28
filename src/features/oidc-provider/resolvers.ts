import { dispatch } from '../../cqs'
import type { Resolvers } from '../../generated/graphql'
import { CreatePresentationRequestForAuthnCommand } from './commands/create-presentation-request-for-authn-command'

export const resolvers: Resolvers = {
  Mutation: {
    createPresentationRequestForAuthn: async (_parent, { request }, context) =>
      dispatch(context, CreatePresentationRequestForAuthnCommand, request),
  },
}
