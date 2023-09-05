import { dispatch, query } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { compactErrors } from '../../util/compact-errors'
import { resolveIssuanceEventData, subscribeToIssuanceEventsWithFilter } from './callback/pubsub'
import { CreateIssuanceRequestCommand } from './commands/create-issuance-request-command'
import { RevokeContractIssuancesCommand } from './commands/revoke-contract-issuances-command'
import { RevokeIdentityIssuancesCommand } from './commands/revoke-identity-issuances-command'
import { RevokeIssuanceCommand } from './commands/revoke-issuance-command'
import { RevokeIssuancesCommand } from './commands/revoke-issuances-command'
import { CountIssuancesByContractQuery } from './queries/count-issuances-by-contract'
import { CountIssuancesByUserQuery } from './queries/count-issuances-by-user-query'
import { CountIssuancesQuery } from './queries/count-issuances-query'
import { FindIssuancesQuery } from './queries/find-issuances-query'

export const resolvers: Resolvers = {
  Query: {
    findIssuances: (_, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindIssuancesQuery, where, offset, limit, orderBy, orderDirection),
    issuanceCount: (_, { where }, context) => query(context, CountIssuancesQuery, where),
    issuanceCountByUser: (_, { where, offset, limit }, context) => query(context, CountIssuancesByUserQuery, where, offset, limit),
    issuanceCountByContract: (_, { where, offset, limit }, context) => query(context, CountIssuancesByContractQuery, where, offset, limit),
  },
  Mutation: {
    createIssuanceRequest: (_, { request }, context) => dispatch(context, CreateIssuanceRequestCommand, request),
    revokeIssuance: (_, { id }, context) => dispatch(context, RevokeIssuanceCommand, id),
    revokeIssuances: (_, { ids }, context) => dispatch(context, RevokeIssuancesCommand, ids),
    revokeContractIssuances: (_, { contractId }, context) => dispatch(context, RevokeContractIssuancesCommand, contractId),
    revokeIdentityIssuances: (_, { identityId }, context) => dispatch(context, RevokeIdentityIssuancesCommand, identityId),
  },
  Contract: {
    issuances: (contract, { where, offset, limit }, context) =>
      query(context, FindIssuancesQuery, { contractId: contract.id, ...where }, offset, limit),
  },
  Identity: {
    issuances: (identity, { where, offset, limit }, context) =>
      query(context, FindIssuancesQuery, { identityId: identity.id, ...where }, offset, limit),
    issuanceCount: ({ id }, _, { dataLoaders: { issuanceCountByIdentity } }) => issuanceCountByIdentity.load(id),
  },
  User: {
    issuances: (user, { where, offset, limit }, context) =>
      query(context, FindIssuancesQuery, { issuedById: user.id, ...where }, offset, limit),
  },
  Issuance: {
    credentialExpiresAt: async ({ expiresAt }) => expiresAt,
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
  Presentation: {
    issuances: (presentation, _, { dataLoaders: { issuances } }) => issuances.loadMany(presentation.issuanceIds).then(compactErrors),
  },
}
