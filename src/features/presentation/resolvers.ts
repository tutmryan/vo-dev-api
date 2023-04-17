import { dispatch, query } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { CreatePresentationRequestCommand } from './commands/create-presentation-request-command'
import { FindPresentationsQuery } from './queries/find-presentations-query'

export const resolvers: Resolvers = {
  Mutation: {
    createPresentationRequest: (_parent, { request }, context) => dispatch(context, CreatePresentationRequestCommand, request),
  },

  Contract: {
    presentations: (contract, { where, offset, limit }, context) =>
      query(context, FindPresentationsQuery, { contractId: contract.id, ...where }, offset, limit),
  },

  PresentationRequestResponse: {
    __resolveType: (response) => ('error' in response ? 'RequestErrorResponse' : 'PresentationResponse'),
  },
}
