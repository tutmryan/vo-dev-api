import { newCacheSection } from '../../cache'
import { limitedAccess } from '../../config'
import type { AcquireLimitedAccessTokenInput } from '../../generated/graphql'
import { createKey } from '../../util/token'

export * from './shield-rules'

const limitedAccessCache = newCacheSection('limitedAccess')

export type LimitedAccessData = AcquireLimitedAccessTokenInput & { userId: string }

export async function getLimitedAccessData(token: string): Promise<LimitedAccessData> {
  const key = createKey(token, limitedAccess.secret)
  const data = await limitedAccessCache.get(key)
  if (!data) throw new Error(`No limited access data found`)
  return JSON.parse(data)
}

export async function setLimitedAccessData(token: string, data: LimitedAccessData): Promise<void> {
  const key = createKey(token, limitedAccess.secret)
  await limitedAccessCache.set(key, JSON.stringify(data), { ttl: 60 * 60 }) // 1 hour - access tokens are valid for 50 minutes + 10 minute buffer
}
