import config from '../../config'
import type { IdentityEntity } from './entities/identity-entity'

export const resolveIssuer = (identityEntity: IdentityEntity) => {
  if (identityEntity.issuer.indexOf('manual') >= 0) return 'Manually Issued'

  const tenantMap = config.get('identityIssuers')
  const tenantId = Object.keys(tenantMap).find((tenantId) => identityEntity.issuer.indexOf(tenantId) >= 0)
  return tenantId ? tenantMap[tenantId]?.name || identityEntity.issuer : identityEntity.issuer
}
