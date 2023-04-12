import { KeyvAdapter } from '@apollo/utils.keyvadapter'
import type { KeyValueCache } from '@apollo/utils.keyvaluecache'
import { InMemoryLRUCache, PrefixingKeyValueCache } from '@apollo/utils.keyvaluecache'
import { isLocalDev } from '@makerxstudio/node-common'
import Keyv from 'keyv'
import config from './config'
import { logger } from './logger'

const redis = config.has('redis') ? config.get('redis') : undefined
const isRedisEnabled = !!redis?.host

if (!isLocalDev && !isRedisEnabled) logger.warn('Redis caching is not configured, falling back to in-memory cache')
else logger.info(`Caching configured using ${isRedisEnabled ? 'Redis' : 'in-memory'} cache`)

const cache: KeyValueCache = isRedisEnabled
  ? new KeyvAdapter(new Keyv(`rediss://:${redis.key}@${redis.host}:6380`))
  : new InMemoryLRUCache()

export const newCacheSection = (prefix: string): KeyValueCache => {
  return new PrefixingKeyValueCache(cache, prefix)
}

export const requestCallbackCache = newCacheSection('verifiedIdRequestCallback')
