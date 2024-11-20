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
import { openidClaims } from './claims'
import type { OidcClientEntity } from './entities/oidc-client-entity'
import type { OidcResourceEntity } from './entities/oidc-resource-entity'

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

export function loadExistingGrant(clients: OidcClientEntity[], resources: OidcResourceEntity[]): Configuration['loadExistingGrant'] {
  return async (ctx) => {
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
        // grant all the OIDC scopes and configured resource scopes to avoid consent prompt
        const oidcScopes = Object.keys(openidClaims).join(' ')
        grant.addOIDCScope(`openid ${oidcScopes}`)

        // if the client has access to resources, grant those scopes as well
        const clientId = ctx.oidc.client.clientId
        invariant(clientId, 'client must be available on oidc context')
        const client = clients.find((c) => c.id.toLowerCase() === clientId)
        invariant(client, `Client ${clientId} not found`)

        for (const clientResource of await client.resources) {
          const resource = resources.find((r) => r.id === clientResource.resourceId)
          invariant(resource, `Resource ${clientResource.resourceId} not found`)
          grant.addResourceScope(resource.resourceIndicator, `${clientResource.resourceScopes.join(' ')} ${oidcScopes}`)
        }

        await grant.save()
      }

      return grant
    }
  }
}
