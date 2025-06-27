import { invariant } from '../../../util/invariant'
import { apiResourceId, portalClientId } from '../data'

export function systemClientInvariant(clientId: string) {
  invariant(clientId !== portalClientId, 'The portal client cannot be modified')
}

export function systemResourceInvariant(resourceId: string) {
  invariant(resourceId !== apiResourceId, 'The API resource cannot be modified')
}
