import { devToolsEnabled } from '../../config'
import type { Resolvers } from '../../generated/graphql'

export const resolvers: Resolvers = {
  Query: {
    discovery: (_parent, _args, { services: { homeTenantGraph } }) => ({
      features: { findTenantIdentities: homeTenantGraph.isConfigured, devToolsEnabled },
    }),
  },
}
