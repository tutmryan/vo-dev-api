import { createHash } from 'crypto'
import { newCacheSection } from '../../cache'
import config from '../../config'
import type { AcquireLimitedAccessTokenInput } from '../../generated/graphql'

export * from './shield-rules'

const limitedAccessCache = newCacheSection('limitedAccess')

function createKey(token: string) {
  const hash = createHash('sha512')
  // add a secret suffix to make the key more opaque
  // limitedAccessSecret needs only be set in deployed environments
  const keySuffix = config.has('limitedAccessSecret') ? config.get('limitedAccessSecret') : ''
  hash.update(token + keySuffix)
  return hash.digest('hex')
}

export type LimitedAccessData = AcquireLimitedAccessTokenInput & { userId: string }

export async function getLimitedAccessData(token: string): Promise<LimitedAccessData> {
  const key = createKey(token)
  const data = await limitedAccessCache.get(key)
  if (!data) throw new Error(`No limited access data found`)
  return JSON.parse(data)
}

export async function setLimitedAccessData(token: string, data: LimitedAccessData): Promise<void> {
  const key = createKey(token)
  await limitedAccessCache.set(key, JSON.stringify(data), { ttl: 60 * 60 }) // 1 hour - access tokens are valid for 50 minutes
}
