import { dispatch } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { CreateIssuanceRequestCommand } from './commands/create-issuance-request-command'

export const resolvers: Resolvers = {
  Mutation: {
    createIssuanceRequest: (_parent, { request }, context) => dispatch(context, CreateIssuanceRequestCommand, request),
  },

  IssuanceRequestResponse: {
    __resolveType: (response) => ('error' in response ? 'RequestErrorResponse' : 'IssuanceResponse'),
  },

  RequestErrorResponse: {
    date: ({ date }) => new Date(date),
  },
}
