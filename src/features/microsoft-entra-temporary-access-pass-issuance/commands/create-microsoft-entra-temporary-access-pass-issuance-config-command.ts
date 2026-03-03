import type { CommandContext } from '../../../cqs'
import type { CreateMicrosoftEntraTemporaryAccessPassIssuanceConfigurationInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { IdentityStoreEntity } from '../../identity-store/entities/identity-store-entity'
import { MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity } from '../entities/microsoft-entra-temporary-access-pass-issuance-configuration-entity'

export async function CreateMicrosoftEntraTemporaryAccessPassIssuanceConfigurationCommand(
  this: CommandContext,
  input: CreateMicrosoftEntraTemporaryAccessPassIssuanceConfigurationInput,
) {
  const { identityStoreId, ...rest } = input

  const entity = new MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity({
    title: rest.title,
    description: rest.description ?? null,
    enabled: rest.enabled,
    lifetimeMinutes: rest.lifetimeMinutes ?? null,
    isUsableOnce: rest.isUsableOnce,
  })

  if (identityStoreId) {
    const store = await this.entityManager.getRepository(IdentityStoreEntity).findOneBy({ id: identityStoreId })
    invariant(store, `Identity store not found: ${identityStoreId}`)
    entity.identityStore = Promise.resolve(store)
    entity.identityStoreId = store.id
  }

  await this.entityManager.getRepository(MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity).save(entity)

  return entity
}
