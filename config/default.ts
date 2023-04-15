import type { Config } from '../src/config'
import type { DeepPartial } from '../src/util/type-helpers'

const config: DeepPartial<Config> = {
  logging: {
    userClaimsToLog: ['oid', 'aud', 'tid', 'azp', 'iss', 'scp', 'roles'],
    requestInfoToLog: ['referer', 'requestId', 'correlationId'],
    omitPaths: [],
    loggerOptions: {
      defaultMeta: {
        service: 'verified-orchestation-api',
      },
      level: 'info',
    },
    consoleOptions: {
      silent: false,
    },
  },
  cookieSession: {
    maxAge: 3600000,
    sameSite: 'none',
    secure: true,
    httpOnly: true,
  },
  database: {
    database: 'VerifiedOrchestration',
    port: 1433,
    logging: true,
  },
  auth: {
    pkce: {
      logoutUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/logout',
      enabled: false,
      msalConfig: {
        system: {
          loggerOptions: {
            piiLoggingEnabled: false,
            logLevel: 0,
          },
        },
      },
    },
  },
  integrations: {
    verifiedIdAdmin: {
      baseUrl: 'https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/',
      auth: {
        tokenUrl: 'https://login.microsoftonline.com/a4577872-4a36-4a93-9846-b29a1220ca89/oauth2/v2.0/token',
        // See https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/vc-network-api#authentication
        scope: '6a8b4b39-c021-437c-b060-5a14a3fd65f3/full_access',
      },
    },
    verifiedIdNetwork: {
      baseUrl: 'https://verifiedid.did.msidentity.com/',
    },
    verifiedIdRequest: {
      baseUrl: 'https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/',
      auth: {
        tokenUrl: 'https://login.microsoftonline.com/a4577872-4a36-4a93-9846-b29a1220ca89/oauth2/v2.0/token',
        scope: '3db474b9-6a0c-4840-96ac-1fceb342124f/.default',
      },
    },
    b2cGraph: {
      auth: {
        tenantId: '10b631d3-9e47-49e1-a938-cbd933f0488d',
      },
      b2cTenantName: 'voonboardingdemo',
    },
  },
  issuanceCallback: {
    route: '/issuance/callback',
    auth: {
      tokenUrl: 'https://login.microsoftonline.com/a4577872-4a36-4a93-9846-b29a1220ca89/oauth2/v2.0/token',
    },
  },
  presentationCallback: {
    route: '/presentation/callback',
    auth: {
      tokenUrl: 'https://login.microsoftonline.com/a4577872-4a36-4a93-9846-b29a1220ca89/oauth2/v2.0/token',
    },
  },
  issuanceRequestRegistration: {
    clientName: 'Verified Orchestration Platform',
  },
}

module.exports = config
