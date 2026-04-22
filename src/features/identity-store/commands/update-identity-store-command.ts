import { identityStoreSecretService } from '..'
import type { CommandContext } from '../../../cqs'
import type { IdentityStoreType, UpdateIdentityStoreInput } from '../../../generated/graphql'
import { notifyIdentityStoreChanged } from '../../instance-configs'
import { IdentityStoreEntity } from '../entities/identity-store-entity'
import { validateClientInput } from './create-identity-store-command'

export async function UpdateIdentityStoreCommand(this: CommandContext, id: string, input: UpdateIdentityStoreInput) {
  const { name, type, isAuthenticationEnabled, accessPackagesEnabled, clientId, clientSecret } = input

  validateClientInput(clientId, clientSecret)

  const repo = this.entityManager.getRepository(IdentityStoreEntity)

  const identityStore = await repo.findOneByOrFail({ id })

  if (clientId && clientSecret) {
    await identityStoreSecretService().set(clientId, clientSecret)
  }

  identityStore.update({
    name,
    type: type as IdentityStoreType,
    isAuthenticationEnabled,
    accessPackagesEnabled,
    clientId,
  })

  const updatedIdentityStore = await repo.save(identityStore)
  notifyIdentityStoreChanged()
  return updatedIdentityStore
}
