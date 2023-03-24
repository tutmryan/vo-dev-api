import type { Config } from '../src/config/schema'

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
  database: {
    host: 'DATABASE_HOST',
    port: json('DATABASE_PORT'),
    database: 'DATABASE_NAME',
    username: 'DATABASE_USERNAME',
    password: 'DATABASE_PASSWORD',
    logging: json('DATABASE_LOGGING'),
  },
  microsoftGraph: {
    auth: {
      clientSecret: 'MICROSOFT_GRAPH_CLIENT_SECRET',
    },
  },
  auth: {
    pkce: {
      msalConfig: {
        auth: {
          clientSecret: 'UI_CLIENT_SECRET',
        },
      },
    },
  },
  integrations: {
    verifiedIdAdmin: {
      auth: {
        clientSecret: 'API_CLIENT_SECRET',
      },
    },
    b2cGraph: {
      auth: {
        clientSecret: 'B2C_GRAPH_CLIENT_SECRET',
      },
    },
  },
}

export default config
