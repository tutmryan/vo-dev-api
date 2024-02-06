import { LogLevel } from '@azure/msal-node'
import type { Config } from '../src/config'
import type { DeepPartial } from '../src/util/type-helpers'

const homeTenantId = 'a4577872-4a36-4a93-9846-b29a1220ca89'

const platformTenantId = '5c14bb50-7602-4c0d-b785-5dee865e4665'
const platformApiClientId = 'c015d766-3423-4d30-8fbc-014191d27825'
const platformTokenUrl = `https://login.microsoftonline.com/${platformTenantId}/oauth2/v2.0/token`

const limitedAccessTokenAudience = 'api://verified-orchestration-internal-non-prod'
const vidCallbackClientId = '2e2b9262-ec52-45da-95bb-4db42286ab52'

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
    omitPaths: ['service', 'trace_id', 'span_id', 'trace_flags', 'logLevel'],
    loggerOptions: {
      level: 'verbose',
    },
  },
  database: { logging: true, database: 'VerifiedOrchestration' },
  redis: { host: 'localhost' },
  blobStorage: {
    url: 'http://127.0.0.1:10000/devstoreaccount1',
    credential: {
      accountName: 'devstoreaccount1',
      accountKey: 'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==',
    },
  },
  auth: {
    bearer: {
      verifyOptions: {
        clockTolerance: 5,
      },
    },
    pkce: {
      enabled: true,
      msalConfig: {
        system: {
          loggerOptions: {
            piiLoggingEnabled: false,
            logLevel: LogLevel.Info,
          },
        },
      },
    },
  },
}

module.exports = config
