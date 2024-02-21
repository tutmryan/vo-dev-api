import type { Configuration as MsalConfiguration } from '@azure/msal-node'
import type { BearerConfig } from '@makerx/express-bearer'
import type { ClientCredentialsConfig } from '@makerx/node-common'
import { createTypedConfig } from '@makerx/node-common'
// eslint-disable-next-line no-restricted-imports
import config from 'config'
import type { CorsOptions } from 'cors'
import type { LoggerOptions } from 'typeorm'
import type { ConsoleTransportOptions } from 'winston/lib/winston/transports'
import type { IssuanceRequestRegistration } from '../services/verified-id'

type ClientCredentials = Pick<ClientCredentialsConfig, 'clientId' | 'clientSecret'>

export type Config = {
  cors: Omit<CorsOptions, 'origin'> & { origin: true | string[] | undefined }
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
      credentials: ClientCredentials
      logoutUrl?: string
      scopes: string[]
      enabled: boolean
      msalConfig: MsalConfiguration
    }
  }
  events: {
    processingTimeoutSeconds: number
    pollingFrequencySeconds: number
    maxProcessingAttempts: number
  }
  /**
   * The instance label, used to generate URLs according to convention
   */
  instance: string
  authorityId: string
  database: {
    host: string
    port: number
    database: string
    logging: LoggerOptions
    username?: string
    password?: string
  }
  redis: {
    host?: string
    key: string
  }
  blobStorage: {
    url: string
    credential?: {
      accountName: string
      accountKey: string
    }
    logoImagesContainer: string
  }
  homeTenant: {
    name: string
    tenantId: string
    graphCredentials: ClientCredentials
    vidServiceCredentials: ClientCredentials
  }
  platformTenant: {
    tenantId: string
    internalClientUri: string
  }
  apiClient: {
    credentials: ClientCredentials
    uri: string
  }
  limitedAccess: {
    credentials: ClientCredentials
    secret?: string
  }
  verifiedIdAdmin: {
    baseUrl: string
    scope: string
  }
  verifiedIdRequest: {
    baseUrl: string
    scope: string
  }
  callbackCredentials: ClientCredentials
  issuanceCallbackRoute: string
  presentationCallbackRoute: string
  issuanceRequestRegistration: IssuanceRequestRegistration
  platformConsumerApps: Record<string, string>
  identityIssuers: Record<string, string>
}

const typedConfig = createTypedConfig<Config>(config)
export default typedConfig
export * from './expanded'
