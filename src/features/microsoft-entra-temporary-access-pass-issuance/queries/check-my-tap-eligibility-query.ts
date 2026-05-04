import type { QueryContext } from '../../../cqs'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { microsoftEntraTemporaryAccessPassService } from '../microsoft-entra-temporary-access-pass-service'

export async function CheckMyTapEligibilityQuery(this: QueryContext) {
  if (!this.user || !(this.user.entity instanceof IdentityEntity)) {
    throw new Error('Identity is required to check TAP eligibility')
  }

  const actions = await microsoftEntraTemporaryAccessPassService.getAvailableSelfServiceActions(this.user.entity)
  return actions
}
