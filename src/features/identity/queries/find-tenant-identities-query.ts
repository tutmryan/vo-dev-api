import { homeTenant } from '../../../config'
import type { QueryContext } from '../../../cqs'
import type { TenantIdentity, TenantIdentityWhere } from '../../../generated/graphql'

export async function FindTenantIdentitiesQuery(
  this: QueryContext,
  criteria: TenantIdentityWhere,
  limit: number,
): Promise<TenantIdentity[]> {
  if (!criteria.nameStartsWith) return []
  const users = await this.services.homeTenantGraph.findUsers(criteria, limit)
  return users.map(({ id, displayName, userType }) => ({
    id: id!,
    name: displayName!,
    issuer: homeTenant.tenantId,
    userType: userType!,
  }))
}
