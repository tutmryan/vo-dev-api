import type { QueryContext } from '../../../cqs'
import type { IdentityStoreCapabilities } from '../../../generated/graphql'

export async function IdentityStoreCapabilitiesQuery(this: QueryContext, id: string): Promise<IdentityStoreCapabilities> {
  await this.services.graphServiceManager.init()
  const graphService = this.services.graphServiceManager.get(id)
  if (!graphService) {
    return { tapWrite: false, tapPolicyInsight: false, accessPackages: false }
  }
  return graphService.checkCapabilities()
}
