import { notifyOidcDataChanged } from '..'
import type { CommandContext } from '../../../cqs'
import { OidcClientResourceEntity } from '../entities/oidc-client-resource-entity'
import { OidcResourceEntity } from '../entities/oidc-resource-entity'
import { systemResourceInvariant } from './utils'

export async function DeleteOidcResourceCommand(this: CommandContext, resourceId: string) {
  systemResourceInvariant(resourceId)

  const repo = this.entityManager.getRepository(OidcResourceEntity)
  const resource = await repo.findOneByOrFail({ id: resourceId })

  // delete all client resources associated with this resource
  this.logger.warn(`Deleting all client resources associated with resource ${resource.resourceIndicator}`)
  this.entityManager.getRepository(OidcClientResourceEntity).delete({ resourceId })

  // delete the resource
  const deleted = await repo.softRemove(resource)

  // notify that the data has changed and return
  notifyOidcDataChanged()
  return deleted
}
