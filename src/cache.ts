import type { KeyValueCache } from '@apollo/utils.keyvaluecache'
import { PrefixingKeyValueCache } from '@apollo/utils.keyvaluecache'
import { cache } from './redis'

export const newCacheSection = (prefix: string): KeyValueCache => {
  return new PrefixingKeyValueCache(cache, prefix)
}

export const REQUEST_CACHE_TTL = 60 * 60 // 1 hour
export const BACKGROUND_JOB_EVENTS_TTL = 5 * 60 // 5 minutes
export const requestCallbackCache = newCacheSection('requestCallback')
export const requestDetailsCache = newCacheSection('requestDetails')
export const finishedBackgroundJobEvents = newCacheSection('finishedBackgroundJobEvents')
