import type { KeyValueCache } from '@apollo/utils.keyvaluecache'
import { InMemoryLRUCache, PrefixingKeyValueCache } from '@apollo/utils.keyvaluecache'
import { environment, isLocalDev } from '@makerx/node-common'
import { PubSub } from 'graphql-subscriptions'
import config from './config'
import { logger } from './logger'
import { redisKeyVAdapter, redisPubsub } from './redis'

const redisConfig = config.has('redis') ? config.get('redis') : undefined
const isRedisEnabled = !!redisConfig?.host

if (!isLocalDev && !isRedisEnabled) {
  if (environment !== 'test') logger.warn('Redis caching is not configured, falling back to in-memory cache')
} else logger.info(`Caching configured using ${isRedisEnabled ? 'Redis' : 'in-memory'} cache`)

const cache: KeyValueCache = isRedisEnabled ? redisKeyVAdapter() : new InMemoryLRUCache()

export const newCacheSection = (prefix: string): KeyValueCache => {
  return new PrefixingKeyValueCache(cache, prefix)
}

export const pubsub = isRedisEnabled ? redisPubsub() : new PubSub()

export const REQUEST_CACHE_TTL = 60 * 60 // 1 hour
export const PRESENTED_CREDENTIALS_TTL = 30 * 60 // 30 minutes
export const requestCallbackCache = newCacheSection('requestCallback')
export const requestDetailsCache = newCacheSection('requestDetails')
export const presentedCredentialsCache = newCacheSection('presentedCredentials')
