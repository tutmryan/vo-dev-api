import { KeyvAdapter } from '@apollo/utils.keyvadapter'
import type { KeyValueCache } from '@apollo/utils.keyvaluecache'
import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache'
import KeyvRedis from '@keyv/redis'
import { environment, isLocalDev } from '@makerx/node-common'
import type { RedisOptions } from 'bullmq'
import { RedisPubSub } from 'graphql-redis-subscriptions'
import { PubSub } from 'graphql-subscriptions'
import Redis from 'ioredis'
import Keyv from 'keyv'
import type { IRateLimiterStoreOptions } from 'rate-limiter-flexible'
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible'
import { redis as redisConfig } from './config'
import { logger } from './logger'
import { Lazy } from './util/lazy'

const isRedisEnabled = !!redisConfig.host

if (!isLocalDev && !isRedisEnabled) {
  if (environment !== 'test') logger.warn('Redis caching is not configured, falling back to in-memory cache')
} else logger.info(`Caching configured using ${isRedisEnabled ? 'Redis' : 'in-memory'} cache`)

export const redisOptions: RedisOptions = {
  host: redisConfig.host,
  port: 6380,
  password: redisConfig.key,
  tls: redisConfig.key ? {} : undefined,
}

const redisClient = Lazy(() => new Redis(redisOptions))
const redisKeyVAdapter = Lazy(() => new KeyvAdapter(new Keyv(isRedisEnabled ? new KeyvRedis(redisClient()) : undefined)))
const redisPubsub = Lazy(() => new RedisPubSub({ publisher: redisClient(), subscriber: redisClient() }))

export const cache: KeyValueCache = isRedisEnabled ? redisKeyVAdapter() : new InMemoryLRUCache()
export const pubsub = isRedisEnabled ? redisPubsub() : new PubSub()
export const rateLimiter = (options: Omit<IRateLimiterStoreOptions, 'storeClient'>) =>
  isRedisEnabled ? new RateLimiterRedis({ ...options, storeClient: redisClient() }) : new RateLimiterMemory(options)
