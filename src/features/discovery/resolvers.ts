import { demoEnabled, devToolsEnabled, docsUrl, faceCheckEnabled, oidcAuthorityUrl, oidcEnabled, portalUrl } from '../../config'
import type { Resolvers } from '../../generated/graphql'

export const resolvers: Resolvers = {
  Query: {
    discovery: (_parent, _args, { services: { homeTenantGraph } }) => ({
      features: { findTenantIdentities: homeTenantGraph.isConfigured, devToolsEnabled, faceCheckEnabled, demoEnabled, oidcEnabled },
      urls: {
        docsUrl,
        portalUrl,
        oidcAuthorityUrl: oidcEnabled ? oidcAuthorityUrl : undefined,
      },
    }),
  },
}
