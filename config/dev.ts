import { LogLevel } from '@azure/msal-node'
import type { Config } from '../src/config/schema'
import type { DeepPartial } from '../src/util/type-helpers'

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
      scopes: ['api://verified-orchestration-api-dev/.default', 'profile'],
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
  integrations: {
    verifiedIdAdmin: {
      auth: {
        // Verified Orchestration API (dev)
        // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/e53f942c-c727-4db9-a857-988bae3e07b6/isMSAApp~/false
        clientId: 'e53f942c-c727-4db9-a857-988bae3e07b6',
      },
    },
    b2cGraph: {
      auth: {
        // Verified Orchestration API B2C Integration (dev)
        // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/40bd620e-c3f8-4493-a7bc-18d7de65953e/isMSAApp~/false
        clientId: '40bd620e-c3f8-4493-a7bc-18d7de65953e',
      },
    },
  },
}

module.exports = config
