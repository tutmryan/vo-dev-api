import type { KeyValueCache } from '@apollo/utils.keyvaluecache'
import { InMemoryLRUCache, PrefixingKeyValueCache } from '@apollo/utils.keyvaluecache'
import { environment, isLocalDev } from '@makerx/node-common'
import { PubSub } from 'graphql-subscriptions'
import { redis } from './config'
import { logger } from './logger'
import { redisKeyVAdapter, redisPubsub } from './redis'

const isRedisEnabled = !!redis.host

if (!isLocalDev && !isRedisEnabled) {
  if (environment !== 'test') logger.warn('Redis caching is not configured, falling back to in-memory cache')
} else logger.info(`Caching configured using ${isRedisEnabled ? 'Redis' : 'in-memory'} cache`)

const cache: KeyValueCache = isRedisEnabled ? redisKeyVAdapter() : new InMemoryLRUCache()

export const newCacheSection = (prefix: string): KeyValueCache => {
  return new PrefixingKeyValueCache(cache, prefix)
}

export const pubsub = isRedisEnabled ? redisPubsub() : new PubSub()

export const REQUEST_CACHE_TTL = 60 * 60 // 1 hour
export const BACKGROUND_JOB_EVENTS_TTL = 5 * 60 // 5 minutes
export const requestCallbackCache = newCacheSection('requestCallback')
export const requestDetailsCache = newCacheSection('requestDetails')
export const finishedBackgroundJobEvents = newCacheSection('finishedBackgroundJobEvents')
