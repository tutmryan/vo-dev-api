import type { CommandContext } from '../../../cqs'
import type { MutationCreateOidcClaimMappingArgs } from '../../../generated/graphql'
import { OidcClaimMappingEntity } from '../entities/oidc-claim-mapping-entity'
import { notifyOidcDataChanged } from '../provider'

export async function CreateOidcClaimMappingCommand(
  this: CommandContext,
  { name, mappings, credentialTypes }: MutationCreateOidcClaimMappingArgs['input'],
): Promise<OidcClaimMappingEntity> {
  OidcClaimMappingEntity.validateScopedMappings(mappings)
  const mapping = OidcClaimMappingEntity.reduceScopedMappings(mappings)
  const claimMapping = new OidcClaimMappingEntity({ name, credentialTypes, mapping })
  const entity = await this.entityManager.getRepository(OidcClaimMappingEntity).save(claimMapping)
  notifyOidcDataChanged()
  return entity
}
