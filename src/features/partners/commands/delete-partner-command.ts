import type { CommandContext } from '../../../cqs'
import { notifyOidcDataChanged } from '../../oidc-provider'
import { PartnerEntity } from '../entities/partner-entity'

export async function DeletePartnerCommand(this: CommandContext, partnerId: string) {
  const repo = this.entityManager.getRepository(PartnerEntity)

  const partner = await repo.findOneByOrFail({ id: partnerId })
  const deleted = await repo.softRemove(partner)

  notifyOidcDataChanged()
  return deleted
}
