import { demoEnabled, devToolsEnabled, docsUrl, faceCheckEnabled, oidcAuthorityUrl, oidcEnabled, portalUrl, version } from '../../config'
import { dispatch } from '../../cqs'
import type { Resolvers } from '../../generated/graphql'
import type { Services } from '../../services'
import { MonitoredServices, serviceErrors } from '../../services/monitoring'
import { TestServicesCommand } from './commands/test-services-command'

export const resolvers: Resolvers = {
  Query: {
    discovery: (_parent, _args, { services }) => resolveDiscovery({ services }),
  },
  Mutation: {
    testServices: async (_parent, _args, context) => {
      await dispatch(context, TestServicesCommand)
      return resolveDiscovery({ services: context.services })
    },
  },
}

function resolveDiscovery({ services: { graphServiceManager } }: { services: Services }) {
  const anyGraphServiceConfigured = graphServiceManager.all.some((gs) => gs.isConfigured)
  return {
    features: {
      findTenantIdentities: anyGraphServiceConfigured,
      devToolsEnabled,
      faceCheckEnabled,
      demoEnabled,
      oidcEnabled,
    },
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
  }
}
