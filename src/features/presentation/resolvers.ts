import { dispatch } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { CreatePresentationRequestCommand } from './commands/create-presentation-request-command'

export const resolvers: Resolvers = {
  Mutation: {
    createPresentationRequest: (_parent, { request }, context) => dispatch(context, CreatePresentationRequestCommand, request),
  },

  PresentationRequestResponse: {
    __resolveType: (response) => ('error' in response ? 'RequestErrorResponse' : 'PresentationResponse'),
  },
}
