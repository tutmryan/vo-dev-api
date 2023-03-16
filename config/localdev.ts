import { LogLevel } from '@azure/msal-node'
import type { Config } from '../src/config/schema'
import type { DeepPartial } from '../src/util/type-helpers'

const config: DeepPartial<Config> = {
  server: {
    port: 4000,
  },
  cors: {
    origin: true,
    credentials: true,
    maxAge: 84000,
  },
  cookieSession: {
    sameSite: 'lax',
    secure: false,
  },
  logging: {
    userClaimsToLog: [],
    requestInfoToLog: [],
    omitPaths: ['service', 'trace_id', 'span_id', 'trace_flags'],
    loggerOptions: {
      level: 'info',
    },
  },
  auth: {
    bearer: {
      jwksUri: 'https://login.microsoftonline.com/a4577872-4a36-4a93-9846-b29a1220ca89/discovery/v2.0/keys',
      verifyOptions: {
        issuer: 'https://sts.windows.net/a4577872-4a36-4a93-9846-b29a1220ca89/',
        audience: ['api://verified-orchestration-api-localdev'],
        clockTolerance: 5,
      },
    },
    pkce: {
      enabled: true,
      scopes: ['api://verified-orchestration-api-localdev/.default', 'profile'],
      logoutUrl: 'https://login.microsoftonline.com/a4577872-4a36-4a93-9846-b29a1220ca89/oauth2/v2.0/logout',
      msalConfig: {
        auth: {
          // Verified Orchestration API UI (localdev)
          // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/20bcde12-9cbc-4a37-9e69-200a1e210530/isMSAApp~/false
          clientId: '20bcde12-9cbc-4a37-9e69-200a1e210530',
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
        // Verified Orchestration API (localdev)
        // https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/3f0968a8-aaf0-407a-b7e9-826d82f0f6a9/isMSAApp~/false
        clientId: '3f0968a8-aaf0-407a-b7e9-826d82f0f6a9',
      },
    },
  },
}

module.exports = config
