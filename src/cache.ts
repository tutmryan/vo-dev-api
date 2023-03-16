import type { KeyValueCache } from '@apollo/utils.keyvaluecache'
import { InMemoryLRUCache, PrefixingKeyValueCache } from '@apollo/utils.keyvaluecache'
import { isProduction } from '@makerxstudio/node-common'
import { logger } from './logger'

// For production, we would use Redis, NOT the in-memory cache
if (isProduction) {
  logger.warn(
    'Caching has not been configured for production use. See https://www.apollographql.com/docs/apollo-server/performance/cache-backends#configuring-redis',
  )
}

const cache = new InMemoryLRUCache() as KeyValueCache

export const newCacheSection = (prefix: string): KeyValueCache => {
  return new PrefixingKeyValueCache(cache, prefix)
}

export const requestCallbackCache = newCacheSection('verifiedIdRequestCallback')
