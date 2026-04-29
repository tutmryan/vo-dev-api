import { identityStoreSecretService } from '..'
import type { CommandContext } from '../../../cqs'
import type { IdentityStoreType, UpdateIdentityStoreInput } from '../../../generated/graphql'
import { logger } from '../../../logger'
import { notifyIdentityStoreChanged } from '../../instance-configs'
import { IdentityStoreEntity } from '../entities/identity-store-entity'
import { validateClientInput } from './create-identity-store-command'

export async function UpdateIdentityStoreCommand(this: CommandContext, id: string, input: UpdateIdentityStoreInput) {
  const { name, type, isAuthenticationEnabled, accessPackagesEnabled, clientId, clientSecret } = input

  validateClientInput(clientId, clientSecret)

  const repo = this.entityManager.getRepository(IdentityStoreEntity)

  const identityStore = await repo.findOneByOrFail({ id })
  const previousClientId = identityStore.clientId ?? null

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

  // Delete the old secret from the KV store when the clientId is being removed
  // or replaced with a different value, to avoid orphaned secret entries.
  const clientIdChanged = clientId !== undefined && clientId !== previousClientId
  if (clientIdChanged && previousClientId) {
    try {
      await identityStoreSecretService().delete(previousClientId)
    } catch (error) {
      logger.warn(`Failed to delete old client secret for identity store ${id} (clientId: ${previousClientId})`, { error })
    }
  }

  const credentialsChanged = !!clientSecret || clientIdChanged
  if (credentialsChanged) {
    this.services.graphServiceManager.clear(id)
  }

  notifyIdentityStoreChanged()
  return updatedIdentityStore
}
