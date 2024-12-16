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
        new RegExp(`^https://${config.get('instance')}\\.verifiedorchestration\\.com$`), // Admin site origin
        new RegExp(`^https://${config.get('instance')}\\.api\\.verifiedorchestration\\.com$`), // API UI origin
        new RegExp(`^https://${config.get('instance')}\\.portal\\.verifiedorchestration\\.com$`), // Portal site origin
      ]
export const cors: CorsOptions = {
  ...rawCors,
  origin,
}
// presentation demo cors - only allow portal origin
export const presentationDemoCors: CorsOptions = {
  ...cors,
  origin: rawCors.origin === true ? true : [new RegExp(`^https://${config.get('instance')}\\.portal\\.verifiedorchestration\\.com$`)],
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
export const limitedPhotoCaptureAuth: ClientCredentialsConfig = {
  scope: internalScope,
  tokenUrl: platformTokenUrl,
  ...config.get('limitedPhotoCapture.credentials'),
}
export const limitedAsyncIssuanceAuth: ClientCredentialsConfig = {
  scope: internalScope,
  tokenUrl: platformTokenUrl,
  ...config.get('limitedAsyncIssuance.credentials'),
}
export const limitedDemoAuth: ClientCredentialsConfig = {
  scope: internalScope,
  tokenUrl: platformTokenUrl,
  ...config.get('limitedDemo.credentials'),
}
export const limitedOidcAuthnAuth: ClientCredentialsConfig = {
  scope: internalScope,
  tokenUrl: platformTokenUrl,
  ...config.get('limitedOidcClient.credentials'),
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

// add known internal app client labels
export const platformConsumerApps = {
  [config.get('limitedDemo.oid')]: 'Portal Demo',
  [config.get('limitedOidcClient.oid')]: 'Authentication Gateway',
  ...config.get('platformConsumerApps'),
}

// the instance config or undefined for localdev
export const instance = config.has('instance') ? config.get('instance') : undefined

// the version of the instance set to 'localdev' for localdev
export const version = config.has('version') ? config.get('version') : 'localdev'

// URLs
export const portalUrl = config.has('instance')
  ? `https://${config.get('instance')}.portal.verifiedorchestration.com`
  : config.has('localDev.tunnel.portal')
    ? config.get('localDev.tunnel.portal')
    : 'http://localhost:5173'

export const apiUrl = instance
  ? `https://${instance}.api.verifiedorchestration.com`
  : config.has('localDev.tunnel.api')
    ? config.get('localDev.tunnel.api')
    : 'http://localhost:4000'

export const oidcAuthorityUrl = `${apiUrl}/oidc`

export const docsUrl = instance ? `https://${instance}.docs.verifiedorchestration.com` : 'http://localhost:3000'

// OIDC provider API scope (the API origin)
export const apiScope = new URL(apiUrl).origin

// default demoEnabled to devToolsEnabled to align without having to set both flags in every environment
export const demoEnabled = config.has('demoEnabled') ? config.get('demoEnabled') : config.get('devToolsEnabled')
