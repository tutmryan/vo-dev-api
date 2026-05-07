import KeyvRedis from '@keyv/redis'
import Keyv from 'keyv'
import { createRedisClient, isRedisEnabled } from '../redis'
import { Lazy } from '../util/lazy'

const redisClient = Lazy(() => createRedisClient('cache'))

export const ONE_MINUTE_TTL = 1000 * 60
export const ONE_HOUR_TTL = ONE_MINUTE_TTL * 60

export const newCacheSection = <T = any>(namespace: string, ttl?: number): Keyv<T> => {
  // Redis Enterprise (EnterpriseCluster) enforces hash-slot constraints even within MULTI/EXEC.
  // Keyv namespace tracking issues SADD on `namespace:<ns>` in the same transaction as the data
  // key `<ns>:<key>`. Wrapping the namespace in {} ensures both keys hash to the same slot.
  const safeNamespace = `{${namespace}}`
  return new Keyv<T>({ store: isRedisEnabled ? new KeyvRedis(redisClient()) : undefined, namespace: safeNamespace, ttl })
}
