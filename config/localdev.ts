import { LogLevel } from '@azure/msal-node'
import type { Config } from '../src/config'
import type { DeepPartial } from '../src/util/type-helpers'
import * as nonprod from './nonprod'

const { platformTenant, apiClient, internalClient, callbackCredentials, limitedAccess, limitedApproval, limitedPhotoCapture } =
  nonprod as Config

const config: DeepPartial<Config> = {
  server: {
    port: 4000,
  },
  cors: {
    origin: true,
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
    url: 'https://127.0.0.1:10000/devstoreaccount1',
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
  platformTenant,
  apiClient,
  internalClient,
  callbackCredentials,
  limitedAccess,
  limitedApproval,
  limitedPhotoCapture,
}

module.exports = config
