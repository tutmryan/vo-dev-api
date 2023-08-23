import config from '../../config'
import type { GraphServiceConfig } from '../../services'
import type { IdentityEntity } from './entities/identity-entity'

export const resolveIssuer = (identityEntity: IdentityEntity) => {
  if (identityEntity.issuer.indexOf('manual') >= 0) return 'Manually Issued'

  const tenantMap = getTenantMap()
  const tenantId = Object.keys(tenantMap).find((tenantId) => identityEntity.issuer.indexOf(tenantId) >= 0)
  return tenantId ? tenantMap[tenantId] : identityEntity.issuer
}

const getTenantMap = () => {
  const homeTenantConfig = config.get('homeTenantGraph')
  const integrationsConfig = config.get('integrations')
  const tenantMap = Object.assign(
    {},
    ...Object.keys(integrationsConfig)
      .map((key) => integrationsConfig[key as keyof typeof integrationsConfig] as GraphServiceConfig)
      .filter((c) => c.auth.tenantId)
      .map((c) => ({ [c.auth.tenantId]: c.tenantName })),
  )
  tenantMap[homeTenantConfig.auth.tenantId] = homeTenantConfig.tenantName
  return tenantMap
}
