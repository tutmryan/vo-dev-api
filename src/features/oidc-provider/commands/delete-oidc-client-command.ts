import { notifyOidcDataChanged } from '..'
import type { CommandContext } from '../../../cqs'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import { systemClientInvariant } from './utils'

export async function DeleteOidcClientCommand(this: CommandContext, clientId: string) {
  systemClientInvariant(clientId)
  const repo = this.entityManager.getRepository(OidcClientEntity)

  const client = await repo.findOneByOrFail({ id: clientId })
  const deleted = await repo.softRemove(client)

  notifyOidcDataChanged()
  return deleted
}
