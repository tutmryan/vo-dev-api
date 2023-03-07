import type { Config } from '../src/config/schema'
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
  databases: {
    verifiedOrchestation: {
      database: 'master',
      logging: true,
    },
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
}

module.exports = config
