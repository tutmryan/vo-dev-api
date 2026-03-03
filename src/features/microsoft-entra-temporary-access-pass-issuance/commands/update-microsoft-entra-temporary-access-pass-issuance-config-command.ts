import type { CommandContext } from '../../../cqs'
import type { UpdateMicrosoftEntraTemporaryAccessPassIssuanceConfigurationInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { IdentityStoreEntity } from '../../identity-store/entities/identity-store-entity'
import { MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity } from '../entities/microsoft-entra-temporary-access-pass-issuance-configuration-entity'

export async function UpdateMicrosoftEntraTemporaryAccessPassIssuanceConfigurationCommand(
  this: CommandContext,
  id: string,
  input: UpdateMicrosoftEntraTemporaryAccessPassIssuanceConfigurationInput,
) {
  const repo = this.entityManager.getRepository(MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity)
  const entity = await repo.findOne({ where: { id } })

  invariant(entity, 'Config not found')

  const { identityStoreId, ...rest } = input

  if (rest.title != null) entity.title = rest.title
  if (rest.description != null) entity.description = rest.description
  if (rest.enabled != null) entity.enabled = rest.enabled
  if (rest.lifetimeMinutes != null) entity.lifetimeMinutes = rest.lifetimeMinutes
  if (rest.isUsableOnce != null) entity.isUsableOnce = rest.isUsableOnce

  if (identityStoreId !== undefined) {
    if (identityStoreId) {
      const store = await this.entityManager.getRepository(IdentityStoreEntity).findOneBy({ id: identityStoreId })
      invariant(store, `Identity store not found: ${identityStoreId}`)
      entity.identityStore = Promise.resolve(store)
      entity.identityStoreId = store.id
    } else {
      entity.identityStore = undefined
      entity.identityStoreId = null
    }
  }

  await this.entityManager.getRepository(MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity).save(entity)

  return entity
}
