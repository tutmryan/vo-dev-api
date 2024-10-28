import type {
  AuthorizationCode,
  BackchannelAuthenticationRequest,
  Client,
  Configuration,
  DeviceCode,
  KoaContextWithOIDC,
  RefreshToken,
} from 'oidc-provider'
import { invariant } from '../../util/invariant'
import { oidcClaims } from './claims'
import { getResourceScopes } from './resource-indicators'

export function useGrantedResource(
  _ctx: KoaContextWithOIDC,
  _model: AuthorizationCode | RefreshToken | DeviceCode | BackchannelAuthenticationRequest,
) {
  return true
}

function isFirstParty(_client: Client) {
  return true
}

/**
 * This implementation is used to skip showing a consent screen.
 * Taken from: https://github.com/panva/node-oidc-provider/blob/main/recipes/skip_consent.md
 */

export const loadExistingGrant: Configuration['loadExistingGrant'] = async (ctx) => {
  invariant(ctx.oidc.session, 'session must be available')
  invariant(ctx.oidc.client, 'client must be available')

  const grantId = ctx.oidc.result?.consent?.grantId || ctx.oidc.session.grantIdFor(ctx.oidc.client.clientId)

  if (grantId) {
    // keep grant expiry aligned with session expiry
    // to prevent consent prompt being requested when grant expires
    const grant = await ctx.oidc.provider.Grant.find(grantId)

    invariant(grant?.exp, 'grant must have an exp value')

    // this aligns the Grant ttl with that of the current session
    // if the same Grant is used for multiple sessions, or is set
    // to never expire, you probably do not want this in your code
    if (ctx.oidc.account && grant.exp < ctx.oidc.session.exp) {
      grant.exp = ctx.oidc.session.exp
      await grant.save()
    }

    return grant
  } else {
    const grant = new ctx.oidc.provider.Grant({
      clientId: ctx.oidc.client.clientId,
      accountId: ctx.oidc.session.accountId,
    })

    if (isFirstParty(ctx.oidc.client)) {
      // grant all the OIDC scopes and resource scopes to avoid consent prompt
      const oidcScopes = Object.keys(oidcClaims).join(' ')
      grant.addOIDCScope(`openid ${oidcScopes}`)
      for (const [resource, scopes] of Object.entries(await getResourceScopes())) {
        grant.addResourceScope(resource, `${scopes.join(' ')} ${oidcScopes}`)
      }
      await grant.save()
    }

    return grant
  }
}
