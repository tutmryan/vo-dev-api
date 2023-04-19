import type { Resolvers } from '../../generated/graphql'

export const resolvers: Resolvers = {
  Query: {
    findNetworkIssuers: (_, { where }, { services: { admin } }) => admin.findNetworkIssuers(where),
    networkContracts: (_, { tenantId, issuerId }, { services: { admin } }) => admin.networkContracts(tenantId, issuerId),
  },
}
