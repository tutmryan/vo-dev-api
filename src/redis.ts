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
  if (environment !== 'test') logger.warn('Redis is not configured, falling back to in-memory caching and pubsub')
} else logger.info(`Caching and pubsub configured using ${isRedisEnabled ? 'Redis' : 'in-memory'} cache`)

export const redisOptions: RedisOptions = {
  host: redisConfig.host,
  port: 6380,
  password: redisConfig.key,
  tls: redisConfig.key ? {} : undefined,
}

function createRedisClient(clientName: 'cache' | 'publisher' | 'subscriber' | 'rate limit', options: RedisOptions = redisOptions) {
  logger.info(`Creating Redis ${clientName} client`)
  const client = new Redis(options)
  client.on('connect', () => logger.info(`Connected to Redis ${clientName} client`))
  client.on('warning', (warning) => logger.warn(`Redis ${clientName} client warning`, warning))
  client.on('error', ({ message, stack, ...rest }) => logger.error(`Redis ${clientName} client error`, { message, stack, ...rest }))
  return client
}

const createRedisKeyVAdapter = Lazy(() => new KeyvAdapter(new Keyv({ store: new KeyvRedis(createRedisClient('cache')) })))
const createRedisPubsub = Lazy(
  () => new RedisPubSub({ publisher: createRedisClient('publisher'), subscriber: createRedisClient('subscriber') }),
)
const redisRateLimitClient = Lazy(() => createRedisClient('rate limit', { ...redisOptions, enableOfflineQueue: false }))

export const cache: KeyValueCache = isRedisEnabled ? createRedisKeyVAdapter() : new InMemoryLRUCache()
export const pubsub = isRedisEnabled ? createRedisPubsub() : new PubSub()
export const rateLimiter = (options: Omit<IRateLimiterStoreOptions, 'storeClient'>) =>
  isRedisEnabled ? new RateLimiterRedis({ ...options, storeClient: redisRateLimitClient() }) : new RateLimiterMemory(options)
