import { newCacheSection } from '../../cache'
import type { AcquireLimitedApprovalTokenInput } from '../../generated/graphql'
import { createKey } from '../../util/token'

const limitedApprovalCache = newCacheSection('limitedApproval')

export type LimitedApprovalData = AcquireLimitedApprovalTokenInput

export async function getLimitedApprovalData(token: string): Promise<LimitedApprovalData> {
  const key = createKey(token)
  const data = await limitedApprovalCache.get(key)
  if (!data) throw new Error(`No limited approval data found`)
  return JSON.parse(data)
}

export async function setLimitedApprovalData(token: string, data: LimitedApprovalData): Promise<void> {
  const key = createKey(token)
  await limitedApprovalCache.set(key, JSON.stringify(data), { ttl: 60 * 60 }) // 1 hour - access tokens are valid for 50 minutes
}
