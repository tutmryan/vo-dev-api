import { dispatch, query } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { CreateIssuanceRequestCommand } from './commands/create-issuance-request-command'
import { CountIssuancesQuery } from './queries/count-issuances-query'
import { FindIssuancesQuery } from './queries/find-issuances-query'

export const resolvers: Resolvers = {
  Query: {
    findIssuances: (_, { where, offset, limit }, context) => query(context, FindIssuancesQuery, where, offset, limit),
    issuanceCount: (_, { where }, context) => query(context, CountIssuancesQuery, where),
  },
  Mutation: {
    createIssuanceRequest: (_, { request }, context) => dispatch(context, CreateIssuanceRequestCommand, request),
  },
  Contract: {
    issuances: (contract, { where, offset, limit }, context) =>
      query(context, FindIssuancesQuery, { contractId: contract.id, ...where }, offset, limit),
  },
  Issuance: {
    credentialExpiresAt: async ({ issuedAt, contractId }, _, { dataLoaders: { contracts } }) => {
      const contract = await contracts.load(contractId)
      return new Date(issuedAt.getTime() + contract.validityIntervalInSeconds * 1000)
    },
  },
  IssuanceRequestResponse: {
    __resolveType: (response) => ('error' in response ? 'RequestErrorResponse' : 'IssuanceResponse'),
  },
  RequestErrorResponse: {
    date: ({ date }) => new Date(date),
  },
}
