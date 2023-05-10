import type { Configuration as MsalConfiguration } from '@azure/msal-node'
import type { BearerConfig } from '@makerxstudio/express-bearer'
import type { ClientCredentialsConfig } from '@makerxstudio/node-common'
import { createTypedConfig } from '@makerxstudio/node-common/typed-config-factory'
import type { MailDataRequired } from '@sendgrid/mail'
// eslint-disable-next-line no-restricted-imports
import config from 'config'
import type { CorsOptions, CorsOptionsDelegate } from 'cors'
import type { LoggerOptions } from 'typeorm'
import type { ConsoleTransportOptions } from 'winston/lib/winston/transports'
import type { IssuanceRequestRegistration } from './services/request'

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
  redis: {
    host: string
    key: string
  }
  microsoftGraph: {
    auth: {
      tenantId: string
      clientId: string
      clientSecret: string
    }
    b2cTenantName: string
  }
  sendgrid: {
    key: string
    templates: {
      onboarding: { mailData: Pick<MailDataRequired, 'templateId' | 'from'>; dynamicTemplateData: { onboarding_url: string } }
    }
  }
  integrations: {
    verifiedIdAdmin: {
      baseUrl: string
      auth: ClientCredentialsConfig
    }
    verifiedIdRequest: {
      baseUrl: string
      auth: ClientCredentialsConfig
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
  issuanceCallback: {
    route: string
    auth: ClientCredentialsConfig
  }
  presentationCallback: {
    route: string
    auth: ClientCredentialsConfig
  }
  issuanceRequestRegistration: IssuanceRequestRegistration
  platformConsumerApps: Record<string, { name: string }>
}

export default createTypedConfig<Config>(config)
