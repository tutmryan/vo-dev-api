import { notifyOidcDataChanged } from '..'
import type { CommandContext } from '../../../cqs'
import { type OidcResourceInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { OidcClientResourceEntity } from '../entities/oidc-client-resource-entity'
import { OidcResourceEntity } from '../entities/oidc-resource-entity'
import { systemResourceInvariant } from './utils'

export async function UpdateOidcResourceCommand(this: CommandContext, resourceId: string, input: OidcResourceInput) {
  systemResourceInvariant(resourceId)
  invariant(input.scopes.length > 0, 'At least one scope is required')

  const repo = this.entityManager.getRepository(OidcResourceEntity)
  const resource = await repo.findOneByOrFail({ id: resourceId })

  // check for removed scopes
  const removedScopes = resource.scopes.filter((scope) => !input.scopes.includes(scope))
  if (removedScopes.length > 0) {
    // update any client resources affected by removal of scopes
    const clientResources = await this.entityManager.getRepository(OidcClientResourceEntity).findBy({ resourceId })
    for (const clientResource of clientResources) {
      const clientScopesToRemove = clientResource.resourceScopes.filter((scope) => removedScopes.includes(scope))
      if (clientScopesToRemove.length === 0) continue
      // remove affected scopes from client resource
      clientResource.resourceScopes = clientResource.resourceScopes.filter((scope) => !clientScopesToRemove.includes(scope))
      // remove or update the client resource
      if (clientResource.resourceScopes.length === 0) {
        this.logger.warn(
          `Removing resource ${resource.resourceIndicator} from client ${(await clientResource.client).name} because all scopes were removed.`,
        )
        await this.entityManager.getRepository(OidcClientResourceEntity).remove(clientResource)
      } else {
        this.logger.warn(
          `Removing resource ${resource.resourceIndicator} scopes ${clientScopesToRemove.join(', ')} from client ${(await clientResource.client).name} because they were removed from the resource.`,
        )
        await this.entityManager.getRepository(OidcClientResourceEntity).save(clientResource)
      }
    }
  }

  resource.update(input)
  const updated = await repo.save(resource)

  notifyOidcDataChanged()
  return updated
}
