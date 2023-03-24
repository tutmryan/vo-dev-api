import type { Configuration as MsalConfiguration } from '@azure/msal-node'
import type { BearerConfig } from '@makerxstudio/express-bearer'
import type { ClientCredentialsConfig, OnBehalfOfConfig } from '@makerxstudio/node-common'
import type { CorsOptions, CorsOptionsDelegate } from 'cors'
import type { LoggerOptions } from 'typeorm'
import type { ConsoleTransportOptions } from 'winston/lib/winston/transports'

export type Config = {
  cors: CorsOptions | CorsOptionsDelegate
  server: {
    port?: number
  }
  logging: {
    userClaimsToLog: string[]
    requestInfoToLog: string[]
    omitPaths: string[]
    loggerOptions: {
      defaultMeta: Record<string, string>
      level: string
    }
    consoleOptions: Omit<ConsoleTransportOptions, 'format'>
  }
  cookieSession: CookieSessionInterfaces.CookieSessionOptions
  auth: {
    bearer: BearerConfig
    pkce: {
      logoutUrl?: string
      scopes: string[]
      enabled: boolean
      msalConfig: MsalConfiguration
    }
  }
  integrationTest: {
    url: string
    clientCredentials: ClientCredentialsConfig & { tenantId: string }
    token: string
  }
  events: {
    processingTimeoutSeconds: number
    pollingFrequencySeconds: number
    maxProcessingAttempts: number
  }
  database: {
    host: string
    port: number
    database: string
    logging: LoggerOptions
    username?: string
    password?: string
  }
  microsoftGraph: {
    auth: {
      tenantId: string
      clientId: string
      clientSecret: string
    }
    b2cTenantName: string
  }
  integrations: {
    verifiedIdAdmin: {
      baseUrl: string
      auth: Omit<OnBehalfOfConfig, 'assertionToken'>
    }
    verifiedIdNetwork: {
      baseUrl: string
    }
    b2cGraph: {
      auth: {
        tenantId: string
        clientId: string
        clientSecret: string
      }
      b2cTenantName: string
    }
  }
}
