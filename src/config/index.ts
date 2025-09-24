import { omit } from 'lodash'
import config from './raw'

/**
 * WHAT is going on with config in this project ???
 *
 * The raw config does not express all fully built configurations,
 * such as auth configs which have lots of strings that must be concatenated with tenant ids and scopes.
 *
 * We prefer *not* to build such config by hand, we prefer to configure the minimum set of variables per instance.
 *
 * So instead of using the raw config throughout, we create and export fully built configs from ./expanded.ts.
 *
 * Thus, this project's config module exports:
 * - fully expanded configs (which need to be built) from ./expanded.ts
 * - all other top level config objects from the raw config (below)
 *
 * To ensure we only use expanded config, the raw config is not exported.
 */

// export the raw Config type
export type { BlobStorageCredentials, ClientCredentials, Config } from './raw'

// export all expanded configs
export * from './expanded'

// export all other top level configs
export const server = config.get('server')
export const logging = config.get('logging')
export const auditLogStreaming = config.get('auditLogStreaming')
export const platformTenant = config.get('platformTenant')
export const cookieSession = config.get('cookieSession')
export const database = config.get('database')
export const redis = config.get('redis')
export const blobStorage = config.get('blobStorage')
export const privateBlobStorage = config.get('privateBlobStorage')
export const sms = config.get('sms')
export const email = config.get('email')
export const events = config.has('events') ? config.get('events') : undefined
export const devToolsEnabled = config.get('devToolsEnabled')
export const faceCheckEnabled = config.get('faceCheckEnabled')
export const oidcEnabled = config.get('oidcEnabled')
export const authorityId = config.get('authorityId')
export const issuanceCallbackRoute = config.get('issuanceCallbackRoute')
export const presentationCallbackRoute = config.get('presentationCallbackRoute')
export const homeTenant = omit(config.get('homeTenant'), ['vidServiceCredentials'])
export const issuanceRequestRegistration = config.get('issuanceRequestRegistration')
export const limitedAccess = config.get('limitedAccess')
export const limitedApproval = config.get('limitedApproval')
export const limitedPhotoCapture = config.get('limitedPhotoCapture')
export const limitedAsyncIssuance = config.get('limitedAsyncIssuance')
export const limitedDemo = config.get('limitedDemo')
export const limitedOidcClient = config.get('limitedOidcClient')
export const verifiedIdAdmin = config.get('verifiedIdAdmin')
export const verifiedIdRequest = config.get('verifiedIdRequest')
export const localDev = config.has('localDev') ? config.get('localDev') : undefined
export const graphQL = config.get('graphQL')
export const platformManagement = config.get('platformManagement')
export const oidcKeyVaultUrl = config.has('oidcKeyVaultUrl') ? config.get('oidcKeyVaultUrl') : undefined
