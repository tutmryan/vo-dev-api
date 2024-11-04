import type { IRateLimiterStoreOptions } from 'rate-limiter-flexible'
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible'
import { createRedisClient, redisOptions } from '.'
import { redis } from '../config'
import { Lazy } from '../util/lazy'

/**
 * Rate limit redis client
 * Special case: enableOfflineQueue is false as per the rate limiter library requirements.
 * This means it will throw an error if used immediately after construction.
 * To counter this, we use `lazyConnect: true` and immediately await `client.connect()`.
 */
const rateLimitRedisClient = Lazy(async () => {
  const client = createRedisClient('rate limit', { ...redisOptions, enableOfflineQueue: false, lazyConnect: true })
  await client.connect()
  return client
})

export const rateLimiter = async (options: Omit<IRateLimiterStoreOptions, 'storeClient'>) =>
  redis.host ? new RateLimiterRedis({ ...options, storeClient: await rateLimitRedisClient() }) : new RateLimiterMemory(options)
