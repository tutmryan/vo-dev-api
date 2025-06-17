import { notifyOidcDataChanged } from '..'
import type { CommandContext } from '../../../cqs'
import { OidcClaimMappingEntity } from '../entities/oidc-claim-mapping-entity'

export async function DeleteOidcClaimMappingCommand(this: CommandContext, id: string) {
  const repo = this.entityManager.getRepository(OidcClaimMappingEntity)

  const mapping = await repo.findOneByOrFail({ id })
  const deleted = await repo.softRemove(mapping)

  notifyOidcDataChanged()
  return deleted
}
