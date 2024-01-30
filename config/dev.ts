import { LogLevel } from '@azure/msal-node'
import type { Config } from '../src/config'
import type { DeepPartial } from '../src/util/type-helpers'

const apiDefaultScope = 'api://verified-orchestration-api-dev/.default'

const config: DeepPartial<Config> = {
  cors: {
    origin: true,
    credentials: true,
    maxAge: 84000,
  },
  auth: {
    bearer: {
      jwksUri: 'https://login.microsoftonline.com/a4577872-4a36-4a93-9846-b29a1220ca89/discovery/v2.0/keys',
      verifyOptions: {
        issuer: 'https://sts.windows.net/a4577872-4a36-4a93-9846-b29a1220ca89/',
        audience: ['api://verified-orchestration-api-dev'],
      },
    },
    pkce: {
      enabled: true,
      scopes: [apiDefaultScope, 'profile'],
      logoutUrl: 'https://login.microsoftonline.com/a4577872-4a36-4a93-9846-b29a1220ca89/oauth2/v2.0/logout',
      msalConfig: {
        auth: {
          // Verified Orchestration API UI (dev)
          // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/0a675e3c-e076-4ebf-97f2-125d3e6ce9f8/isMSAApp~/false
          clientId: '0a675e3c-e076-4ebf-97f2-125d3e6ce9f8',
          authority: 'https://login.microsoftonline.com/a4577872-4a36-4a93-9846-b29a1220ca89',
          knownAuthorities: ['https://login.microsoftonline.com/a4577872-4a36-4a93-9846-b29a1220ca89'],
        },
        system: {
          loggerOptions: {
            piiLoggingEnabled: false,
            logLevel: LogLevel.Info,
          },
        },
      },
    },
  },
  homeTenantGraph: {
    auth: {
      clientId: 'e53f942c-c727-4db9-a857-988bae3e07b6',
    },
  },
  redis: {
    host: 'vo-dev-verified-orchestration-redis.redis.cache.windows.net',
  },
  blobStorage: {
    url: 'https://vodevvrfdorchstnst.blob.core.windows.net',
  },
  limitedAccessClient: {
    clientId: '53022c73-6efc-406b-873a-8916c3451006',
    scope: apiDefaultScope,
  },
  integrations: {
    verifiedIdAdmin: {
      authorityId: '9568e470-f1e8-755f-94df-19e75efd45a1',
      auth: {
        // Verified Orchestration API (dev)
        // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/e53f942c-c727-4db9-a857-988bae3e07b6/isMSAApp~/false
        clientId: 'e53f942c-c727-4db9-a857-988bae3e07b6',
      },
    },
    verifiedIdRequest: {
      auth: {
        // Verified Orchestration API (dev)
        // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/e53f942c-c727-4db9-a857-988bae3e07b6/isMSAApp~/false
        clientId: 'e53f942c-c727-4db9-a857-988bae3e07b6',
      },
    },
  },
  issuanceCallback: {
    auth: {
      // Verified Orchestration VID callback (dev)
      // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/836da20a-6fab-483a-9153-08f8673b9eb2/isMSAApp~/false
      clientId: '836da20a-6fab-483a-9153-08f8673b9eb2',
      scope: apiDefaultScope,
    },
  },
  presentationCallback: {
    auth: {
      // Verified Orchestration VID callback (dev)
      // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/836da20a-6fab-483a-9153-08f8673b9eb2/isMSAApp~/false
      clientId: '836da20a-6fab-483a-9153-08f8673b9eb2',
      scope: apiDefaultScope,
    },
  },
}

module.exports = config
