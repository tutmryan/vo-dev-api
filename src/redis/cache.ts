import KeyvRedis from '@keyv/redis'
import Keyv from 'keyv'
import { redis } from '../config'
import { createRedisClient } from '../redis'
import { Lazy } from '../util/lazy'

const redisClient = Lazy(() => createRedisClient('cache'))

export const ONE_MINUTE_TTL = 1000 * 60
export const ONE_HOUR_TTL = ONE_MINUTE_TTL * 60

export const newCacheSection = <T = any>(namespace: string, ttl?: number): Keyv<T> => {
  const useRedis = !!redis.host
  return new Keyv<T>({ store: useRedis ? new KeyvRedis(redisClient()) : undefined, namespace, ttl })
}
