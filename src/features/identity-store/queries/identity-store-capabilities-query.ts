import type { QueryContext } from '../../../cqs'
import type { IdentityStoreCapabilities } from '../../../generated/graphql'

export async function IdentityStoreCapabilitiesQuery(this: QueryContext, id: string, forceRefresh?: boolean): Promise<IdentityStoreCapabilities> {
  const graphService = await this.services.graphServiceManager.get(id)
  if (!graphService) {
    return { tapWrite: false, tapPolicyInsight: false, accessPackages: false }
  }
  return graphService.checkCapabilities(forceRefresh)
}
