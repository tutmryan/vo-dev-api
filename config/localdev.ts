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
  databases: {
    verifiedOrchestation: {
      host: 'localhost',
      port: 1433,
      username: 'sa',
      password: '7o}R~=XA1jmz!-aHQ^pA',
    },
  },
  auth: {
    bearer: {
      jwksUri: 'https://makerxb2cdev.b2clogin.com/makerxb2cdev.onmicrosoft.com/B2C_1_konvoy_localdev/discovery/v2.0/keys',
      verifyOptions: {
        issuer: 'https://makerxb2cdev.b2clogin.com/2c6429d4-2bed-404b-8af9-864187a9d034/v2.0/',
        audience: ['0621ae2f-b414-4181-9e33-445727c4e0a8'],
        clockTolerance: 5,
      },
    },
    pkce: {
      enabled: true,
      scopes: [
        'profile',
        'https://makerxb2cdev.onmicrosoft.com/konvoy-api-localdev/Konvoy.UserAccess',
        'https://makerxb2cdev.onmicrosoft.com/konvoy-api-localdev/Konvoy.AdminAccess',
      ],
      logoutUrl: 'https://makerxb2cdev.b2clogin.com/makerxb2cdev.onmicrosoft.com/B2C_1_konvoy_localdev/oauth2/v2.0/logout',
      msalConfig: {
        auth: {
          clientId: 'dda65adc-f788-405b-9c0a-5b8e1d59b750',
          authority: 'https://makerxb2cdev.b2clogin.com/makerxb2cdev.onmicrosoft.com/B2C_1_konvoy_localdev',
          knownAuthorities: ['makerxb2cdev.b2clogin.com'],
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
}

module.exports = config
