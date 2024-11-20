import { notifyOidcDataChanged } from '..'
import type { CommandContext } from '../../../cqs'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import { OidcClientResourceEntity } from '../entities/oidc-client-resource-entity'
import { systemClientInvariant } from './utils'

export async function DeleteOidcClientResourceCommand(this: CommandContext, clientId: string, resourceId: string) {
  systemClientInvariant(clientId)

  const repo = this.entityManager.getRepository(OidcClientResourceEntity)

  const clientResource = await repo.findOneByOrFail({ clientId, resourceId })
  await repo.remove(clientResource)
  const updated = await this.entityManager.getRepository(OidcClientEntity).findOneByOrFail({ id: clientId })

  notifyOidcDataChanged()
  return updated
}
