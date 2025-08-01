import { demoEnabled, devToolsEnabled, docsUrl, faceCheckEnabled, oidcAuthorityUrl, oidcEnabled, portalUrl, version } from '../../config'
import type { Resolvers } from '../../generated/graphql'
import { MonitoredServices, serviceErrors } from '../../services/monitoring'

export const resolvers: Resolvers = {
  Query: {
    discovery: (_parent, _args, { services: { homeTenantGraph } }) => ({
      features: { findTenantIdentities: homeTenantGraph.isConfigured, devToolsEnabled, faceCheckEnabled, demoEnabled, oidcEnabled },
      urls: {
        docsUrl,
        portalUrl,
        oidcAuthorityUrl: oidcEnabled ? oidcAuthorityUrl : undefined,
      },
      version,
      serviceFailures: {
        msGraph: serviceErrors[MonitoredServices.MSGraph],
        verifiedId: serviceErrors[MonitoredServices.VerifiedID],
      },
    }),
  },
}
