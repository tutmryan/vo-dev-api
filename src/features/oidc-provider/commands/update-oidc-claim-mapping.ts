import type { CommandContext } from '../../../cqs'
import type { MutationUpdateOidcClaimMappingArgs } from '../../../generated/graphql'
import { OidcClaimMappingEntity } from '../entities/oidc-claim-mapping-entity'
import { notifyOidcDataChanged } from '../provider'

export async function UpdateOidcClaimMappingCommand(
  this: CommandContext,
  id: string,
  { name, mappings, credentialTypes }: MutationUpdateOidcClaimMappingArgs['input'],
): Promise<OidcClaimMappingEntity> {
  const repo = this.entityManager.getRepository(OidcClaimMappingEntity)
  const existing = await repo.findOneByOrFail({ id })

  OidcClaimMappingEntity.validateScopedMappings(mappings)
  const mapping = OidcClaimMappingEntity.reduceScopedMappings(mappings)
  existing.update({ name, credentialTypes, mapping })
  const updated = await repo.save(existing)

  notifyOidcDataChanged()
  return updated
}
