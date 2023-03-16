import type { Resolvers } from '../../generated/graphql'

export const resolvers: Resolvers = {
  Query: {
    findNetworkIssuers: (_, { where }, { services: { network } }) => network.findNetworkIssuers(where),
    networkContracts: (_, { tenantId, issuerId }, { services: { network } }) => network.contracts(tenantId, issuerId),
  },
}
