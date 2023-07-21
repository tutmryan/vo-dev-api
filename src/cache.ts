import { KeyvAdapter } from '@apollo/utils.keyvadapter'
import type { KeyValueCache } from '@apollo/utils.keyvaluecache'
import { InMemoryLRUCache, PrefixingKeyValueCache } from '@apollo/utils.keyvaluecache'
import { environment, isLocalDev } from '@makerx/node-common'
import { RedisPubSub } from 'graphql-redis-subscriptions'
import { PubSub } from 'graphql-subscriptions'
import Keyv from 'keyv'
import config from './config'
import type { RequestCredential } from './generated/graphql'
import { logger } from './logger'

const redisConfig = config.has('redis') ? config.get('redis') : undefined
const isRedisEnabled = !!redisConfig?.host
const redisConnectionString = isRedisEnabled ? `rediss://:${redisConfig.key}@${redisConfig.host}:6380` : undefined

if (!isLocalDev && !isRedisEnabled) {
  if (environment !== 'test') logger.warn('Redis caching is not configured, falling back to in-memory cache')
} else logger.info(`Caching configured using ${isRedisEnabled ? 'Redis' : 'in-memory'} cache`)

const cache: KeyValueCache = isRedisEnabled
  ? new KeyvAdapter(new Keyv(redisConnectionString, { namespace: 'cache' }))
  : new InMemoryLRUCache()

export const newCacheSection = (prefix: string): KeyValueCache => {
  return new PrefixingKeyValueCache(cache, prefix)
}

export const pubsub = isRedisEnabled ? new RedisPubSub({ connection: redisConnectionString }) : new PubSub()

export interface IssuanceRequestDetails {
  userId: string
  identityId: string
  contractId: string
}
export interface PresentationRequestDetails {
  userId: string
  identityId: string
  contractIds: string[]
  requestedCredentials: RequestCredential[]
}

export const REQUEST_CACHE_TTL = 60 * 60 // 1 hour
export const requestCallbackCache = newCacheSection('requestCallback')
export const requestDetailsCache = newCacheSection('requestDetails')
