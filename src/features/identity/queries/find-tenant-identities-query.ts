import type { QueryContext } from '../../../cqs'
import type { TenantIdentity, TenantIdentityWhere } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'

export async function FindTenantIdentitiesQuery(
  this: QueryContext,
  criteria: TenantIdentityWhere,
  limit: number,
): Promise<TenantIdentity[]> {
  if (criteria.nameStartsWith === '') return []

  const {
    dataLoaders: { identityStores },
  } = this

  const identityStore = await identityStores.load(criteria.identityStoreId)
  invariant(identityStore, `No IdentityStore found for id: ${criteria.identityStoreId}`)
  const graphService = await this.services.graphServiceManager.get(identityStore.id)
  invariant(graphService, `No GraphService for identity store id: ${identityStore.id}`)

  const users = await graphService.findUsers(criteria, limit)
  return users.map(({ id, displayName, userType }) => ({
    id: id!,
    name: displayName!,
    issuer: identityStore.identifier,
    userType: userType!,
  }))
}
