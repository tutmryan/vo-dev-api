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
      jwksUri: 'https://makerxb2cdev.b2clogin.com/makerxb2cdev.onmicrosoft.com/B2C_1_konvoy_dev/discovery/v2.0/keys',
      verifyOptions: {
        issuer: 'https://makerxb2cdev.b2clogin.com/2c6429d4-2bed-404b-8af9-864187a9d034/v2.0/',
        audience: ['d2ea9f84-18c7-480f-83aa-621f8f427c9a'],
      },
    },
    pkce: {
      enabled: true,
      scopes: [
        'profile',
        'https://makerxb2cdev.onmicrosoft.com/konvoy-api-dev/Konvoy.UserAccess',
        'https://makerxb2cdev.onmicrosoft.com/konvoy-api-dev/Konvoy.AdminAccess',
      ],
      logoutUrl: 'https://makerxb2cdev.b2clogin.com/makerxb2cdev.onmicrosoft.com/B2C_1_konvoy_dev/oauth2/v2.0/logout',
      msalConfig: {
        auth: {
          clientId: 'aec29108-05d6-42e2-a124-2a60adfe4a94',
          authority: 'https://makerxb2cdev.b2clogin.com/makerxb2cdev.onmicrosoft.com/B2C_1_konvoy_dev',
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
