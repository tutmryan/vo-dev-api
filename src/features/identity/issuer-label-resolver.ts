import { identityIssuers } from '../../config'
import type { IdentityEntity } from './entities/identity-entity'

export const resolveIssuerLabel = (identityEntity: IdentityEntity) => {
  if (identityEntity.issuer.indexOf('manual') >= 0) return 'Manually Issued'
  return identityIssuers[identityEntity.issuer] ?? null
}
