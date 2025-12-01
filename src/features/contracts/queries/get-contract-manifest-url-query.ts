import type { QueryContext } from '../../../cqs'

export async function GetContractManifestUrlQuery(this: QueryContext, externalId: string | null) {
  if (!externalId) return null
  const { services } = this
  const externalContract = await services.verifiedIdAdmin.contract(externalId)
  return externalContract?.manifestUrl || null
}
