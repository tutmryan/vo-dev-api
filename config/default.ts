import type { Config } from '../src/config'
import type { DeepPartial } from '../src/util/type-helpers'

const config: DeepPartial<Config> = {
  cors: {
    maxAge: 84000,
    credentials: true,
    origin: [],
  },
  logging: {
    userClaimsToLog: ['oid', 'aud', 'tid', 'azp', 'iss', 'scp', 'roles'],
    requestInfoToLog: ['origin', 'requestId', 'correlationId'],
    omitPaths: [],
    loggerOptions: {
      defaultMeta: {
        service: 'verified-orchestration-api',
      },
      level: 'audit',
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
    port: 1433,
    logging: true,
  },
  blobStorage: {
    logoImagesContainer: 'logo-images',
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
    bearer: {},
  },
  verifiedIdAdmin: {
    baseUrl: 'https://verifiedid.did.msidentity.com/v1.0/',
    // See https://learn.microsoft.com/en-us/entra/verified-id/admin-api#authentication
    scope: '6a8b4b39-c021-437c-b060-5a14a3fd65f3/.default',
  },
  verifiedIdRequest: {
    baseUrl: 'https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/',
    // See https://learn.microsoft.com/en-us/entra/verified-id/vc-network-api#authentication
    scope: '3db474b9-6a0c-4840-96ac-1fceb342124f/.default',
  },
  issuanceCallbackRoute: '/issuance/callback',
  presentationCallbackRoute: '/presentation/callback',
  issuanceRequestRegistration: {
    clientName: 'Verified Orchestration Platform',
  },
  platformConsumerApps: {},
  identityIssuers: {
    manual: 'Manually Issued',
  },
}

module.exports = config
