import type { ClientCredentialsConfig } from '@makerx/node-common'
import { merge } from 'lodash'
import type { Config } from '.'
import config from '.'

/**
 * This module exports fully expanded configs using home tenant / platform tenant configuration options
 */

const platformTenantId = config.get('platformTenant.tenantId')
const homeTenantId = config.get('homeTenant.tenantId')
const apiCredentials = config.get('apiClient.credentials')

const internalScope = `${config.get('platformTenant.internalClientUri')}/.default`
const platformTokenUrl = `https://login.microsoftonline.com/${platformTenantId}/oauth2/v2.0/token`

// internal client credentials configs
export const callbackAuth: ClientCredentialsConfig = {
  scope: internalScope,
  tokenUrl: platformTokenUrl,
  ...config.get('callbackCredentials'),
}
export const limitedAccessAuth: ClientCredentialsConfig = {
  scope: internalScope,
  tokenUrl: platformTokenUrl,
  ...config.get('limitedAccess.credentials'),
}

// VID service client credentials config
export const hasHomeTenantAuthority = config.has('homeTenant.authorityId')
export const authorityId = hasHomeTenantAuthority ? config.get('homeTenant.authorityId') : config.get('platformTenant.authorityId')
export const vidServiceAuth: Omit<ClientCredentialsConfig, 'scope'> = {
  tokenUrl: hasHomeTenantAuthority ? `https://login.microsoftonline.com/${homeTenantId}/oauth2/v2.0/token` : platformTokenUrl,
  ...(hasHomeTenantAuthority ? config.get('homeTenant.vidServiceCredentials') : apiCredentials),
}

// auth configs
export const bearer: Config['auth']['bearer'] = merge(
  {
    jwksUri: `https://login.microsoftonline.com/${homeTenantId}/discovery/v2.0/keys`,
    verifyOptions: {
      issuer: [`https://sts.windows.net/${homeTenantId}/`, `https://sts.windows.net/${platformTenantId}/`],
      audience: [apiCredentials.clientId, config.get('platformTenant.internalClientUri')],
    },
  },
  config.get('auth.bearer'),
)
export const pkce: Config['auth']['pkce'] = merge(
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
  config.get('auth.pkce'),
)

// resource configs
const resourcePrefix = config.has('resourcePrefix') ? config.get('resourcePrefix') : process.env.NODE_ENV
export const database: Config['database'] = merge({ database: `${resourcePrefix}-database` }, config.get('database'))
export const blobStorage: Config['blobStorage'] = merge(
  {
    url: `https://${resourcePrefix}.blob.core.windows.net`,
  },
  config.get('blobStorage'),
)
export const redis: Config['redis'] = merge({ host: `${resourcePrefix}.redis.cache.windows.net` }, config.get('redis'))
