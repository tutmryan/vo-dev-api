import { compact, pick } from 'lodash'
import type {
  AccessToken,
  AuthorizationCode,
  BackchannelAuthenticationRequest,
  Client,
  ClientCredentials,
  DeviceCode,
  KoaContextWithOIDC,
} from 'oidc-provider'
import { logger } from '../../logger'
import { openidClaims } from './claims'

/**
 * Always issue a refresh token
 * https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#issuerefreshtoken
 */
export async function issueRefreshToken(
  ctx: KoaContextWithOIDC,
  client: Client,
  code: AuthorizationCode | DeviceCode | BackchannelAuthenticationRequest,
) {
  if (!client.grantTypeAllowed('refresh_token')) {
    return false
  }
  return code.scopes.has('offline_access') || (client.applicationType === 'web' && client.clientAuthMethod === 'none')
}

/**
 * Add account claims to an access token for a resource.
 * There may be a better way to do this, but I cannot see any recommended method to add claims to an access token for a resource.
 */
export async function extraTokenClaims(ctx: KoaContextWithOIDC, _token: AccessToken | ClientCredentials) {
  const authorizationCode = (ctx.oidc as any).authorizationCode as AuthorizationCode | undefined
  if (!authorizationCode) {
    logger.warn('No authorization code found in context, cannot add extra token claims')
    return undefined
  }

  const account = ctx.oidc.account
  if (!account) {
    logger.warn('No account found in context, cannot add extra token claims')
    return undefined
  }

  // add OIDC claims to the access token
  const scopes = [...authorizationCode.scopes]
  const accountClaims = await account.claims('access_token', scopes.join(' '), {}, [])
  const requestedOidcClaims = compact(scopes.map((scope) => openidClaims[scope as keyof typeof openidClaims]).flat())
  return pick(accountClaims, requestedOidcClaims)
}
