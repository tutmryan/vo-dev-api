import type { QueryContext } from '../../../cqs'
import type { MsGraphFailure } from '../../../generated/graphql'

export async function TestIdentityStoreGraphClientQuery(this: QueryContext, identityStoreId: string): Promise<MsGraphFailure | null> {
  const graphService = await this.services.graphServiceManager.get(identityStoreId)
  if (!graphService) {
    return {
      identityStoreId,
      error: 'No GraphService configured for this identityStoreId',
    }
  }
  return (await graphService.testConnection()) ?? null
}
