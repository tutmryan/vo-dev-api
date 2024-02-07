import type { Config } from '../src/config'

type EnvVarParsingRule = { __name: string; __format: string }

type EnvVarSubstitution<T> = {
  [key in keyof T]?:
    | Uppercase<string>
    | EnvVarParsingRule
    | (T[key] extends Date ? never : T[key] extends object ? EnvVarSubstitution<T[key]> : never)
}

const json = <T extends Uppercase<string>>(varName: T): { __name: T; __format: 'json' } => ({
  __name: varName,
  __format: 'json',
})

const config: EnvVarSubstitution<Config> = {
  server: {
    port: json('PORT'),
  },
  cookieSession: {
    secret: 'COOKIE_SECRET',
  },
  logging: {
    consoleOptions: {
      silent: json('SILENT_CONSOLE'),
    },
  },
  resourcePrefix: 'RESOURCE_PREFIX',
  authorityId: 'VID_AUTHORITY_ID',
  database: {
    host: 'DATABASE_HOST',
    port: json('DATABASE_PORT'),
    database: 'DATABASE_NAME',
    username: 'DATABASE_USERNAME',
    password: 'DATABASE_PASSWORD',
    logging: json('DATABASE_LOGGING'),
  },
  redis: {
    host: 'REDIS_HOST',
    key: 'REDIS_KEY',
  },
  homeTenant: {
    name: 'HOME_TENANT_NAME',
    tenantId: 'HOME_TENANT_ID',
    graphCredentials: {
      clientId: 'HOME_TENANT_GRAPH_CLIENT_ID',
      clientSecret: 'HOME_TENANT_GRAPH_CLIENT_SECRET',
    },
    vidServiceCredentials: {
      clientId: 'HOME_TENANT_VID_SERVICE_CLIENT_ID',
      clientSecret: 'HOME_TENANT_VID_SERVICE_CLIENT_SECRET',
    },
  },
  platformTenant: {
    tenantId: 'PLATFORM_TENANT_ID',
    internalClientUri: 'INTERNAL_CLIENT_URI',
  },
  apiClient: {
    credentials: {
      clientId: 'API_CLIENT_ID',
      clientSecret: 'API_CLIENT_SECRET',
    },
    uri: 'API_CLIENT_URI',
  },
  auth: {
    pkce: {
      msalConfig: {
        auth: {
          clientSecret: 'API_CLIENT_SECRET',
        },
      },
    },
  },
  limitedAccess: {
    credentials: {
      clientId: 'LIMITED_ACCESS_CLIENT_ID',
      clientSecret: 'LIMITED_ACCESS_CLIENT_SECRET',
    },
    secret: 'LIMITED_ACCESS_SECRET',
  },
  callbackCredentials: {
    clientId: 'VID_CALLBACK_CLIENT_ID',
    clientSecret: 'VID_CALLBACK_CLIENT_SECRET',
  },
  identityIssuers: {
    tenantId: 'HOME_TENANT_NAME',
    ...json('IDENTITY_ISSUERS'),
  },
  platformConsumerApps: json('PLATFORM_CONSUMER_APPS'),
}

export default config
