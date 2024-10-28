import type { Client, KoaContextWithOIDC, ResourceServer } from 'oidc-provider'
import { oidcProviderModule } from '.'
import { apiScope } from '../../config'
import { OidcScopes } from '../../roles'

export async function getResourceScopes() {
  return { [apiScope]: [OidcScopes.issuee] }
}

export async function getResourceServerInfo(_ctx: KoaContextWithOIDC, resourceIndicator: string, _client: Client): Promise<ResourceServer> {
  const { errors } = await oidcProviderModule()
  // TODO validate resouceIndicator based on the client
  if (resourceIndicator !== apiScope) throw new errors.InvalidTarget()
  return {
    scope: OidcScopes.issuee,
    accessTokenFormat: 'jwt',
    jwt: {
      sign: { alg: 'PS256' },
    },
  }
}
