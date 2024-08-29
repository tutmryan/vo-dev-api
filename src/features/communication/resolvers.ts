import { query } from '../../cqs'
import type { Resolvers } from '../../generated/graphql'
import { FindCommunicationsQuery } from './queries/find-communications-query'

export const resolvers: Resolvers = {
  Query: {
    findCommunications: async (_, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindCommunicationsQuery, where, offset, limit, orderBy, orderDirection),
  },
  Communication: {
    createdBy: async ({ createdById }, _, { dataLoaders: { users } }) => users.load(createdById),
    recipient: async ({ recipientId }, _, { dataLoaders: { identities } }) => identities.load(recipientId),
  },
  AsyncIssuanceRequest: {
    communications: async ({ id }, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindCommunicationsQuery, { ...where, asyncIssuanceRequestId: id }, offset, limit, orderBy, orderDirection),
  },
}
