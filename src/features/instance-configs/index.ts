import { type MultiIssuerBearerAuthOptions } from '@makerx/express-bearer'
import type { CorsOptions } from 'cors'
import type { JwtPayload } from 'jsonwebtoken'
import { debounce, merge } from 'lodash'
import {
  apiCredentials,
  authBearer,
  homeTenant,
  instance,
  internalClientIssuerOptions,
  oidcIssuerOptions,
  platformConsumerApps,
  rawCors,
} from '../../config'
import { dataSource } from '../../data'
import { IdentityStoreType } from '../../generated/graphql'
import { logger } from '../../logger'
import { pubsub } from '../../redis/pubsub'
import { graphServiceManager } from '../../services'
import { IdentityStoreEntity } from '../identity-store/entities/identity-store-entity'
import { ApplicationLabelConfigEntity } from './entities/application-label-config-entity'
import { CorsOriginConfigEntity } from './entities/cors-origins-config-entity'

const homeTenantId = homeTenant.tenantId

// --- CORS CONFIG ---
const CORS_CONFIG_CHANGED_TOPIC = 'CORS_CONFIG_CHANGED'
export const dbCors: string[] = []

export async function reloadDbCors() {
  const rows = await dataSource.getRepository(CorsOriginConfigEntity).find({
    comment: 'ReloadDbCors',
  })
  dbCors.length = 0
  dbCors.push(...rows.map((r) => r.origin))
}

export const notifyCorsConfigChanged = debounce(() => pubsub().publish(CORS_CONFIG_CHANGED_TOPIC, {}), 1000)

// --- IDENTITY STORE CONFIG ---
const IDENTITY_STORE_CHANGED_TOPIC = 'IDENTITY_STORE_CHANGED'
export const dbAuthEnabledTenantIds: string[] = []

export async function reloadDbAuthEnabledTenantIds() {
  const rows = await dataSource.getRepository(IdentityStoreEntity).find({
    where: { isAuthenticationEnabled: true, type: IdentityStoreType.Entra },
    comment: 'ReloadDbAuthEnabledTenantIds',
  })
  const tenantIds = rows.map((r) => r.identifier)
  dbAuthEnabledTenantIds.length = 0
  dbAuthEnabledTenantIds.push(...tenantIds)
}

export const notifyIdentityStoreChanged = debounce(() => pubsub().publish(IDENTITY_STORE_CHANGED_TOPIC, {}), 1000)

// --- APPLICATION LABEL CONFIG ---
const APPLICATION_LABEL_CONFIG_CHANGED_TOPIC = 'APPLICATION_LABEL_CONFIG_CHANGED'
export const dbApplicationLabels: Record<string, string> = {}

export async function reloadDbApplicationLabels() {
  const rows = await dataSource.getRepository(ApplicationLabelConfigEntity).find({
    comment: 'ReloadDbApplicationLabels',
  })
  const applicationLabels = rows.map((r) => ({ identifier: r.identifier, name: r.name }))
  for (const key in dbApplicationLabels) {
    delete dbApplicationLabels[key]
  }
  applicationLabels.forEach(({ identifier, name }) => {
    dbApplicationLabels[identifier] = name
  })
}

export const notifyApplicationLabelConfigChanged = debounce(() => pubsub().publish(APPLICATION_LABEL_CONFIG_CHANGED_TOPIC, {}), 1000)

// --- INIT ---
async function safeReload(reload: () => Promise<any>) {
  try {
    await reload()
  } catch (err) {
    logger.error('Loading db configurations failed', { err })
  }
}

export async function initDbConfigs() {
  await Promise.all([
    safeReload(reloadDbCors),
    safeReload(reloadDbAuthEnabledTenantIds),
    safeReload(reloadDbApplicationLabels),
    graphServiceManager.reload(),
  ])

  pubsub().subscribe(CORS_CONFIG_CHANGED_TOPIC, () => safeReload(reloadDbCors))
  pubsub().subscribe(IDENTITY_STORE_CHANGED_TOPIC, async () => {
    await safeReload(reloadDbAuthEnabledTenantIds)
    await graphServiceManager.reload()
  })
  pubsub().subscribe(APPLICATION_LABEL_CONFIG_CHANGED_TOPIC, () => safeReload(reloadDbApplicationLabels))
}

// -- EXPANDED CONFIGS --
export const corsConfig: CorsOptions = {
  ...rawCors,
  get origin() {
    if (rawCors.origin === true) return true
    return [
      ...(rawCors.origin ?? []).map((pattern) => new RegExp(pattern)), //Keep for env var backward compability?
      ...dbCors.map((pattern) => new RegExp(pattern)),
      new RegExp(`^https://${instance}\\.verifiedorchestration\\.com$`), // Admin site origin
      new RegExp(`^https://${instance}\\.api\\.verifiedorchestration\\.com$`), // API UI origin
      new RegExp(`^https://${instance}\\.portal\\.verifiedorchestration\\.com$`), // Portal site origin
    ]
  },
}

// --- PLATFORM CONSUMER APPS ---
export function getPlatformConsumerApps() {
  return {
    ...platformConsumerApps,
    ...dbApplicationLabels,
  }
}

// EAM issuer config - customer tenant issued tokens
// We accept EAM tokens from any customer tenant
// Note: The audience claim will be the EAM client (and thus is not known and can't be validated)
// We cannot validate the audience claim for EAM tokens
export function getEamIssuerOptions(): MultiIssuerBearerAuthOptions['issuerOptions'] {
  return [...new Set([homeTenantId, ...dbAuthEnabledTenantIds])].reduce<MultiIssuerBearerAuthOptions['issuerOptions']>((acc, tenantId) => {
    const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`
    acc[issuer] = merge(
      {
        jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
        verifyOptions: {
          issuer,
        },
      },
      authBearer,
    )
    return acc
  }, {})
}

// Customer tenant issuer config - customer tenant issued tokens for the API audience
// Validate audience as the API client ID (this is the enterprise app installed into customer tenants)
// This config is used to validate API access from customer users and apps
export function getCustomerTenantIssuerOptions(): MultiIssuerBearerAuthOptions['issuerOptions'] {
  return [...new Set([homeTenantId, ...dbAuthEnabledTenantIds])].reduce<MultiIssuerBearerAuthOptions['issuerOptions']>((acc, tenantId) => {
    const issuer = `https://sts.windows.net/${tenantId}/`
    acc[issuer] = merge(
      {
        jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
        verifyOptions: {
          issuer,
          audience: apiCredentials.clientId,
        },
      },
      authBearer,
    )
    return acc
  }, {})
}

// For access to the API, we accept tokens from:
// - Customer tenants
// - Internal client
// - OIDC provider
export function getIssuerOptions(): MultiIssuerBearerAuthOptions['issuerOptions'] {
  return {
    ...getCustomerTenantIssuerOptions(),
    [internalClientIssuerOptions.verifyOptions.issuer]: internalClientIssuerOptions,
    [oidcIssuerOptions.verifyOptions.issuer]: oidcIssuerOptions,
  }
}

export function getAdAuthConfig(decoded: JwtPayload) {
  if (!decoded.aud || !decoded.iss) return undefined

  // Accept both API and internal client audiences
  const validAudiences = [apiCredentials.clientId, internalClientIssuerOptions.verifyOptions.audience]
  if (!validAudiences.includes(decoded.aud as string)) return undefined

  const tenantIssuers = [...new Set([homeTenantId, ...dbAuthEnabledTenantIds])].map((tenantId) => `https://sts.windows.net/${tenantId}/`)
  const allowedIssuers = [...tenantIssuers, internalClientIssuerOptions.verifyOptions.issuer]
  if (!allowedIssuers.includes(decoded.iss)) return undefined

  // Return the correct audience for this token
  return { allowedIssuers, audience: decoded.aud as string }
}
