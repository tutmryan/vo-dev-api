import type { CommandContext } from '../../../cqs'
import { invariant } from '../../../util/invariant'
import { notifyOidcDataChanged } from '../../oidc-provider'
import { PartnerEntity } from '../entities/partner-entity'

export async function SuspendPartnerCommand(this: CommandContext, partnerId: string) {
  const repo = this.entityManager.getRepository(PartnerEntity)

  const partner = await repo.findOne({
    where: {
      id: partnerId,
    },
    withDeleted: true,
  })
  invariant(partner, 'Partner not found')
  const deleted = await repo.softRemove(partner, { reload: true })

  notifyOidcDataChanged()
  return deleted
}
