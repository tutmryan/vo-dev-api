import { identityIssuers } from '../../config'
import type { IdentityEntity } from './entities/identity-entity'

export const resolveIssuer = (identityEntity: IdentityEntity) => {
  if (identityEntity.issuer.indexOf('manual') >= 0) return 'Manually Issued'

  const tenantId = Object.keys(identityIssuers).find((tenantId) => identityEntity.issuer.indexOf(tenantId) >= 0)
  return tenantId ? identityIssuers[tenantId] || identityEntity.issuer : identityEntity.issuer
}
