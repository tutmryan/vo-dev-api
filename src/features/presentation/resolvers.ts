import { dispatch, query } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { CreatePresentationRequestCommand } from './commands/create-presentation-request-command'
import { CountPresentationsQuery } from './queries/count-presentations-query'
import { FindPresentationsQuery } from './queries/find-presentations-query'

export const resolvers: Resolvers = {
  Query: {
    findPresentations: (_parent, { where, offset, limit }, context) => query(context, FindPresentationsQuery, where, offset, limit),
    presentationCount: (_parent, { where }, context) => query(context, CountPresentationsQuery, where),
  },
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
