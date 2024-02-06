import type { Configuration as MsalConfiguration } from '@azure/msal-node'
import type { BearerConfig } from '@makerx/express-bearer'
import type { ClientCredentialsConfig } from '@makerx/node-common'
import { createTypedConfig } from '@makerx/node-common'
// eslint-disable-next-line no-restricted-imports
import config from 'config'
import type { CorsOptions, CorsOptionsDelegate } from 'cors'
import { merge } from 'lodash'
import type { LoggerOptions } from 'typeorm'
import type { ConsoleTransportOptions } from 'winston/lib/winston/transports'
import type { IssuanceRequestRegistration } from './services/verified-id'

type ClientCredentials = Pick<ClientCredentialsConfig, 'clientId' | 'clientSecret'>

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
      credentials: ClientCredentials
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
    authorityId: string
    vidServiceCredentials: ClientCredentials
  }
  platformTenant: {
    tenantId: string
    authorityId: string
    internalClientUri: string
  }
  apiClient: {
    credentials: ClientCredentials
    uri: string
  }
  limitedAccess: {
    credentials: ClientCredentials
    secret: string
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
  resourcePrefix: string
}

const typedConfig = createTypedConfig<Config>(config)
export default typedConfig

// export various configs based on the home tenant / platform tenant configurations

const platformTenantId = typedConfig.get('platformTenant.tenantId')
const homeTenantId = typedConfig.get('homeTenant.tenantId')
export const platformTokenUrl = `https://login.microsoftonline.com/${platformTenantId}/oauth2/v2.0/token`
export const apiCredentials = typedConfig.get('apiClient.credentials')
export const internalScope = `${typedConfig.get('platformTenant.internalClientUri')}/.default`
export const callbackAuth: ClientCredentialsConfig = {
  scope: internalScope,
  tokenUrl: platformTokenUrl,
  ...typedConfig.get('callbackCredentials'),
}
export const limitedAccessAuth: ClientCredentialsConfig = {
  scope: internalScope,
  tokenUrl: platformTokenUrl,
  ...typedConfig.get('limitedAccess.credentials'),
}

export const hasHomeTenantAuthority = typedConfig.has('homeTenant.authorityId')
export const authorityId = hasHomeTenantAuthority
  ? typedConfig.get('homeTenant.authorityId')
  : typedConfig.get('platformTenant.authorityId')
export const vidServiceAuth: Omit<ClientCredentialsConfig, 'scope'> = {
  tokenUrl: hasHomeTenantAuthority ? `https://login.microsoftonline.com/${homeTenantId}/oauth2/v2.0/token` : platformTokenUrl,
  ...(hasHomeTenantAuthority ? typedConfig.get('homeTenant.vidServiceCredentials') : apiCredentials),
}

export const bearerConfig: Config['auth']['bearer'] = merge(
  {
    jwksUri: `https://login.microsoftonline.com/${homeTenantId}/discovery/v2.0/keys`,
    verifyOptions: {
      issuer: [`https://sts.windows.net/${homeTenantId}/`, `https://sts.windows.net/${platformTenantId}/`],
      audience: [apiCredentials.clientId, typedConfig.get('platformTenant.internalClientUri')],
    },
  },
  typedConfig.get('auth.bearer'),
)

export const pckeConfig: Config['auth']['pkce'] = merge(
  {
    scopes: [`${apiCredentials.clientId}/.default`, 'profile'],
    logoutUrl: `https://login.microsoftonline.com/${homeTenantId}/oauth2/v2.0/logout`,
    msalConfig: {
      auth: {
        clientId: apiCredentials.clientId,
        authority: `https://login.microsoftonline.com/${homeTenantId}`,
        knownAuthorities: [`https://login.microsoftonline.com/${homeTenantId}`],
      },
    },
  },
  typedConfig.get('auth.pkce'),
)

const resourcePrefix = typedConfig.has('resourcePrefix') ? typedConfig.get('resourcePrefix') : process.env.NODE_ENV
export const redisConfig = merge({ host: `${resourcePrefix}.redis.cache.windows.net` }, typedConfig.get('redis'))
export const blobStorageConfig = merge(
  {
    url: `https://${resourcePrefix}.blob.core.windows.net`,
  },
  typedConfig.get('blobStorage'),
)
export const databaseConfig = merge({ database: `${resourcePrefix}-database` }, typedConfig.get('database'))
