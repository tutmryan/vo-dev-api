import { limitedApproval } from '../../config'
import type { AcquireLimitedApprovalTokenInput } from '../../generated/graphql'
import { newCacheSection, ONE_HOUR_TTL } from '../../redis/cache'
import { Lazy } from '../../util/lazy'
import { createKey } from '../../util/token'

const limitedApprovalCache = Lazy(() => newCacheSection('limitedApproval', ONE_HOUR_TTL)) // 1 hour - access tokens are valid for 50 minutes + 10 minute buffer

export type LimitedApprovalData = AcquireLimitedApprovalTokenInput & { userId: string; presentationId?: string }

export async function getLimitedApprovalData(token: string): Promise<LimitedApprovalData> {
  const key = getLimitedApprovalKey(token)
  return await getLimitedApprovalDataByKey(key)
}

export async function getLimitedApprovalDataByKey(key: string): Promise<LimitedApprovalData> {
  const data = await limitedApprovalCache().get(key)
  if (!data) throw new Error('Invalid token')
  return JSON.parse(data)
}

export async function setLimitedApprovalData(token: string, data: LimitedApprovalData): Promise<void> {
  const key = getLimitedApprovalKey(token)
  await setLimitedApprovalDataByKey(key, data)
}

export async function setLimitedApprovalDataByKey(key: string, data: LimitedApprovalData): Promise<void> {
  await limitedApprovalCache().set(key, JSON.stringify(data))
}

export const getLimitedApprovalKey = (token: string) => createKey(token, limitedApproval.secret)
