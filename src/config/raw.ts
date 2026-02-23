import config from 'config'

import type { Configuration as MsalConfiguration } from '@azure/msal-node'
import type { BearerConfig } from '@makerx/express-bearer'
import type { ClientCredentialsConfig } from '@makerx/node-common'
import { createTypedConfig } from '@makerx/node-common'
import type { MailDataRequired } from '@sendgrid/mail'
import type { CorsOptions } from 'cors'
import type { LoggerOptions } from 'typeorm'
import type { ConsoleTransportOptions } from 'winston/lib/winston/transports'
import type { IssuanceRequestRegistration } from '../services/verified-id'

export type ClientCredentials = Pick<ClientCredentialsConfig, 'clientId' | 'clientSecret'>
export type BlobStorageCredentials = { accountName: string; accountKey: string }

export type EmailTemplateConfig = {
  id: string
  asm: MailDataRequired['asm']
}

export type Config = {
  cors: Omit<CorsOptions, 'origin'> & { origin: true | string[] | undefined }
  server: {
    port?: number
  }
  logging: {
    redactPaths: string[]
    userClaimsToLog: string[]
    requestInfoToLog: string[]
    omitPaths: string[]
    loggerOptions: {
      defaultMeta: Record<string, string>
      level: string
    }
    consoleOptions: Omit<ConsoleTransportOptions, 'format'>
  }
  auditLogStreaming: {
    dataCollectionEndpoint: string
    dataCollectionRuleId: string
    dataCollectionClientId: string
    dataCollectionClientSecret: string
  }
  cookieSession: CookieSessionInterfaces.CookieSessionOptions
  auth: {
    bearer: Omit<BearerConfig, 'jwksUri'>
    pkce: {
      credentials: ClientCredentials
      logoutUrl?: string
      scopes: string[]
      msalConfig: MsalConfiguration
    }
    additionalAuthTenantIds: string[]
  }
  events: {
    processingTimeoutSeconds: number
    pollingFrequencySeconds: number
    maxProcessingAttempts: number
  }
  instance: string
  version: string
  devToolsEnabled: boolean
  faceCheckEnabled: boolean
  demoEnabled: boolean
  oidcEnabled: boolean
  mdoc: {
    presentationsEnabled: boolean
    multipazTestCertificatesEnabled: boolean
  }
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
    port: number
    key: string
  }
  blobStorage: {
    url: string
    credentials?: BlobStorageCredentials
    logoImagesContainer: string
  }
  privateBlobStorage: {
    url: string
    credentials?: BlobStorageCredentials
    asyncIssuanceContainer: string
    oidcContainer: string
    localdevClientSecretsContainer: string
    clientEncryptionKey: string
  }
  oidcKeyVaultUrl: string
  identityStoreKeyVaultUrl: string
  sms: {
    accountSid: string
    sid: string
    secret: string
    primaryToken: string
    messagingServiceSid: string
  }
  email: {
    from: { name: string; email: string }
    apiKey: string
    webhookForwarder: {
      url: string
      secret: string
    }
    templates: {
      issuance: EmailTemplateConfig
      verification: EmailTemplateConfig
    }
  }
  homeTenant: {
    name: string
    tenantId: string
    vidServiceCredentials: ClientCredentials
  }
  platformTenant: {
    tenantId: string
  }
  apiClient: {
    credentials: ClientCredentials
    uri: string
  }
  internalClient: {
    credentials: ClientCredentials
    uri: string
  }
  limitedAccess: {
    credentials: ClientCredentials
    secret?: string
  }
  limitedApproval: {
    credentials: ClientCredentials
    secret?: string
  }
  limitedPhotoCapture: {
    credentials: ClientCredentials
    secret?: string
  }
  limitedAsyncIssuance: {
    credentials: ClientCredentials
    secret?: string
  }
  limitedDemo: {
    oid: string
    credentials: ClientCredentials
    secret?: string
  }
  limitedOidcClient: {
    oid: string
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
  localDev: {
    tunnel: {
      api: string
      portal: string
    }
    email: {
      disabled: boolean
      allowList: string[]
    }
    sms: {
      disabled: boolean
      allowList: string[]
    }
  }
  graphQL: {
    maxAliases: number
    maxDepth: number
    maxDirectives: number
    maxTokens: number
  }
  platformManagement: {
    remoteUrl: string
    transformFilters: {
      types: string[]
      fields: Record<string, string[]>
      inputFields: Record<string, string[]>
    }
  }
  sdk: {
    baseUrl: string
  }
}

const typedConfig = createTypedConfig<Config>(config)
export default typedConfig
export * from './expanded'
