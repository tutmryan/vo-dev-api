import { notifyOidcDataChanged } from '..'
import type { CommandContext } from '../../../cqs'
import type { OidcClientResourceInput } from '../../../generated/graphql'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import { OidcClientResourceEntity } from '../entities/oidc-client-resource-entity'
import { systemClientInvariant } from './utils'

export async function UpdateOidcClientResourceCommand(this: CommandContext, clientId: string, input: OidcClientResourceInput) {
  systemClientInvariant(clientId)

  const repo = this.entityManager.getRepository(OidcClientResourceEntity)

  const clientResource = await repo.findOneByOrFail({ clientId, resourceId: input.resourceId })
  clientResource.update(input)
  await repo.save(clientResource)

  const updated = await this.entityManager.getRepository(OidcClientEntity).findOneByOrFail({ id: clientId })

  notifyOidcDataChanged()
  return updated
}
