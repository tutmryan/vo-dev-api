import { type ClientCredentialsConfig } from '@makerx/node-common'
import type { CorsOptions } from 'cors'
import { merge } from 'lodash'
import type { Config } from './raw'
import config from './raw'

const platformTenantId = config.get('platformTenant.tenantId')
const homeTenantId = config.get('homeTenant.tenantId')
const apiCredentials = config.get('apiClient.credentials')
const internalClientCredentials = config.get('internalClient.credentials')

const internalScope = `${config.get('internalClient.uri')}/.default`
const platformTokenUrl = `https://login.microsoftonline.com/${platformTenantId}/oauth2/v2.0/token`
const homeTenantTokenUrl = `https://login.microsoftonline.com/${homeTenantId}/oauth2/v2.0/token`

// cors
const rawCors = config.get('cors')
const origin: CorsOptions['origin'] =
  rawCors.origin === true
    ? true
    : [
        ...(rawCors.origin ?? []).map((origin) => new RegExp(origin)),
        new RegExp(`^https://${config.get('instance')}.verifiedorchestration.com$`), // Admin site origin
        new RegExp(`^https://${config.get('instance')}.api.verifiedorchestration.com$`), // API UI origin
        new RegExp(`^https://${config.get('instance')}.portal.verifiedorchestration.com$`), // Portal site origin
      ]
export const cors: CorsOptions = {
  ...rawCors,
  origin,
}

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
export const limitedApprovalAuth: ClientCredentialsConfig = {
  scope: internalScope,
  tokenUrl: platformTokenUrl,
  ...config.get('limitedApproval.credentials'),
}

// VID service client credentials config
export const hasHomeTenantAuthority = config.has('homeTenant.vidServiceCredentials.clientId')
export const vidServiceAuth: Omit<ClientCredentialsConfig, 'scope'> = hasHomeTenantAuthority
  ? {
      tokenUrl: homeTenantTokenUrl,
      ...config.get('homeTenant.vidServiceCredentials'),
    }
  : {
      tokenUrl: platformTokenUrl,
      ...internalClientCredentials,
    }

// auth configs
const authTenantIds = [...config.get('auth.additionalAuthTenantIds'), homeTenantId, platformTenantId]
export const bearer: Config['auth']['bearer'] = merge(
  {
    jwksUri: `https://login.microsoftonline.com/${homeTenantId}/discovery/v2.0/keys`,
    verifyOptions: {
      issuer: authTenantIds.map((tenantId) => `https://sts.windows.net/${tenantId}/`),
      audience: [apiCredentials.clientId, config.get('internalClient.uri')],
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

// add default home tenant mapping with configured identityIssuers
export const identityIssuers = { [config.get('homeTenant.tenantId')]: config.get('homeTenant.name'), ...config.get('identityIssuers') }
export const portalUrl = `https://${config.get('instance')}.portal.verifiedorchestration.com`
