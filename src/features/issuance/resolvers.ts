import { dispatch, query } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { resolveIssuanceEventData, subscribeToIssuanceEventsWithFilter } from './callback/pubsub'
import { CreateIssuanceRequestCommand } from './commands/create-issuance-request-command'
import { RevokeIssuanceCommand } from './commands/revoke-issuance-command'
import { CountIssuancesByContractQuery } from './queries/count-issuances-by-contract'
import { CountIssuancesByUserQuery } from './queries/count-issuances-by-user-query'
import { CountIssuancesQuery } from './queries/count-issuances-query'
import { FindIssuancesQuery } from './queries/find-issuances-query'

export const resolvers: Resolvers = {
  Query: {
    findIssuances: (_, { where, offset, limit }, context) => query(context, FindIssuancesQuery, where, offset, limit),
    issuanceCount: (_, { where }, context) => query(context, CountIssuancesQuery, where),
    issuanceCountByUser: (_, { where, offset, limit }, context) => query(context, CountIssuancesByUserQuery, where, offset, limit),
    issuanceCountByContract: (_, { where, offset, limit }, context) => query(context, CountIssuancesByContractQuery, where, offset, limit),
  },
  Mutation: {
    createIssuanceRequest: (_, { request }, context) => dispatch(context, CreateIssuanceRequestCommand, request),
    revokeIssuance: (_, { id }, context) => dispatch(context, RevokeIssuanceCommand, id),
  },
  Contract: {
    issuances: (contract, { where, offset, limit }, context) =>
      query(context, FindIssuancesQuery, { contractId: contract.id, ...where }, offset, limit),
  },
  Identity: {
    issuances: (identity, { where, offset, limit }, context) =>
      query(context, FindIssuancesQuery, { identityId: identity.id, ...where }, offset, limit),
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
  Subscription: {
    issuanceEvent: {
      subscribe: subscribeToIssuanceEventsWithFilter,
      resolve: resolveIssuanceEventData,
    },
  },
}
