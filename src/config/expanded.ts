import type { MultiIssuerBearerAuthOptions } from '@makerx/express-bearer'
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

export const docsUrl = instance ? `https://${instance}.docs.verifiedorchestration.com` : 'http://localhost:3000'

// default demoEnabled to devToolsEnabled to align without having to set both flags in every environment
export const demoEnabled = config.has('demoEnabled') ? config.get('demoEnabled') : config.get('devToolsEnabled')

export const oidcAuthorityUrl = `${apiUrl}/oidc`

// Customer tenant issuer config - customer tenant issued tokensnfor the API audience
// Validate audience as the API client ID (this is the enterprise app installed into customer tenants)
// This config is used to validate API access from customer users and apps
const customerTenantIssuerOptions = [homeTenantId, ...config.get('auth.additionalAuthTenantIds')].reduce<
  MultiIssuerBearerAuthOptions['issuerOptions']
>((acc, tenantId) => {
  const issuer = `https://sts.windows.net/${tenantId}/`
  acc[issuer] = merge(
    {
      jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
      verifyOptions: {
        issuer,
        audience: apiCredentials.clientId,
      },
    },
    config.get('auth.bearer'),
  )
  return acc
}, {})

// Internal client issuer config - platform tenant issued tokens
// This config is used to validate API access via JWTs that we issue, example:
// - VID service callback tokens
// - Limited access tokens
// - Limited approval tokens
// - Limited photo capture tokens
// - Limited async issuance tokens
// - Limited demo tokens
export const internalClientIssuerOptions = merge(
  {
    jwksUri: `https://login.microsoftonline.com/${platformTenantId}/discovery/v2.0/keys`,
    verifyOptions: {
      issuer: `https://sts.windows.net/${platformTenantId}/`,
      audience: [config.get('internalClient.uri')],
    },
  },
  config.get('auth.bearer'),
)

// OIDC provider issuer config - OIDC issued tokens
// We only accept tokens from the OIDC provider that have the API as the audience
const oidcIssuerOptions = merge(
  {
    jwksUri: `${oidcAuthorityUrl}/jwks`,
    verifyOptions: {
      issuer: oidcAuthorityUrl,
      audience: apiUrl,
    },
  },
  config.get('auth.bearer'),
)

// EAM issuer config - customer tenant issued tokens
// We accept EAM tokens from any customer tenant
// Note: The audience claim will be the EAM client (and thus is not known and can't be validated)
// We cannot validate the audience claim for EAM tokens
export const eamIssuerOptions = [homeTenantId, ...config.get('auth.additionalAuthTenantIds')].reduce<
  MultiIssuerBearerAuthOptions['issuerOptions']
>((acc, tenantId) => {
  const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`
  acc[issuer] = merge(
    {
      jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
      verifyOptions: {
        issuer,
      },
    },
    config.get('auth.bearer'),
  )
  return acc
}, {})

// For access to the API, we accept tokens from:
// - Customer tenants
// - Internal client
// - OIDC provider
export const issuerOptions: MultiIssuerBearerAuthOptions['issuerOptions'] = {
  ...customerTenantIssuerOptions,
  [internalClientIssuerOptions.verifyOptions.issuer]: internalClientIssuerOptions,
  [oidcIssuerOptions.verifyOptions.issuer]: oidcIssuerOptions,
}
