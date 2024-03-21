import { newCacheSection } from '../../cache'
import { limitedApproval } from '../../config'
import type { AcquireLimitedApprovalTokenInput } from '../../generated/graphql'
import { createKey } from '../../util/token'

const limitedApprovalCache = newCacheSection('limitedApproval')

export type LimitedApprovalData = AcquireLimitedApprovalTokenInput & { userId: string; presentationId?: string }

export async function getLimitedApprovalData(token: string): Promise<LimitedApprovalData> {
  const key = getLimitedApprovalKey(token)
  return await getLimitedApprovalDataByKey(key)
}

export async function getLimitedApprovalDataByKey(key: string): Promise<LimitedApprovalData> {
  const data = await limitedApprovalCache.get(key)
  if (!data) throw new Error('Invalid token')
  return JSON.parse(data)
}

export async function setLimitedApprovalData(token: string, data: LimitedApprovalData): Promise<void> {
  const key = getLimitedApprovalKey(token)
  await setLimitedApprovalDataByKey(key, data)
}

export async function setLimitedApprovalDataByKey(key: string, data: LimitedApprovalData): Promise<void> {
  await limitedApprovalCache.set(key, JSON.stringify(data), { ttl: 60 * 60 }) // 1 hour - access tokens are valid for 50 minutes
}

export const getLimitedApprovalKey = (token: string) => createKey(token, limitedApproval.secret)
