import type { CommandContext } from '../../../cqs'
import { invariant } from '../../../util/invariant'
import { notifyOidcDataChanged } from '../../oidc-provider'
import { PartnerEntity } from '../entities/partner-entity'

/**
 * The VO solution uses soft delete to mark the partner as suspended. Soft deleted partners won't appear unless deliberately queried.
 * This solution may change in the future to a more explicit suspension mechanism. It's a trade-off between simplicity and explicitness
 * and we're not sure which one is better yet.
 *
 * Regardless of which solution we choose, there will be no API changes are required to change the implementation.
 */
export async function SuspendPartnerCommand(this: CommandContext, partnerId: string) {
  const repo = this.entityManager.getRepository(PartnerEntity)

  const partner = await repo.findOne({
    where: {
      id: partnerId,
    },
    withDeleted: true,
  })
  invariant(partner, 'Partner not found')
  const suspended = await repo.softRemove(partner, { reload: true })

  notifyOidcDataChanged()
  return suspended
}
