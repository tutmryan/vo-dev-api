import type { Client, KoaContextWithOIDC, ResourceServer } from 'oidc-provider'
import { oidcProviderModule } from '.'
import { invariant } from '../../util/invariant'
import type { OidcClientEntity } from './entities/oidc-client-entity'
import type { OidcResourceEntity } from './entities/oidc-resource-entity'

export function getResourceServerInfo(clients: OidcClientEntity[], resources: OidcResourceEntity[]) {
  return async (_ctx: KoaContextWithOIDC, resourceIndicator: string, client: Client): Promise<ResourceServer> => {
    const { errors } = await oidcProviderModule()

    // look up the client and validate the client is configured to have access to the resource
    const clientEntity = clients.find((c) => c.id.toLowerCase() === client.clientId)
    invariant(clientEntity, `Client ${client.clientId} not found`)
    const clientResources = await clientEntity.resources
    const clientResource = clientResources.find(({ resourceId }) => {
      const resource = resources.find((r) => r.id === resourceId)
      invariant(resource, `Resource ${resourceId} not found`)
      return resource.resourceIndicator === resourceIndicator
    })
    if (!clientResource) throw new errors.InvalidTarget()

    // return the client's configured resource scopes
    return {
      scope: clientResource.resourceScopes.join(' '),
      accessTokenFormat: 'jwt',
      jwt: {
        sign: { alg: 'PS256' },
      },
    }
  }
}
