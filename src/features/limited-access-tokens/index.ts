import { limitedAccess } from '../../config'
import type { AcquireLimitedAccessTokenInput } from '../../generated/graphql'
import { ONE_HOUR_TTL, newCacheSection } from '../../redis/cache'
import { Lazy } from '../../util/lazy'
import { createKey } from '../../util/token'

export * from './shield-rules'

const limitedAccessCache = Lazy(() => newCacheSection('limitedAccess', ONE_HOUR_TTL)) // 1 hour - access tokens are valid for 50 minutes + 10 minute buffer

export type LimitedAccessDemoToken = { isDemoToken?: true }

export type LimitedAccessData = AcquireLimitedAccessTokenInput & LimitedAccessDemoToken & { userId: string }

export async function getLimitedAccessData(token: string): Promise<LimitedAccessData> {
  const key = createKey(token, limitedAccess.secret)
  const data = await limitedAccessCache().get(key)
  if (!data) throw new Error(`No limited access data found`)
  return JSON.parse(data)
}

export async function setLimitedAccessData(token: string, data: LimitedAccessData): Promise<void> {
  const key = createKey(token, limitedAccess.secret)
  await limitedAccessCache().set(key, JSON.stringify(data))
}
