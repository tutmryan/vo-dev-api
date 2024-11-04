import { newCacheSection, ONE_HOUR_TTL } from '../../redis/cache'
import { Lazy } from '../../util/lazy'

export const requestCallbackCache = Lazy(() => newCacheSection('requestCallback', ONE_HOUR_TTL))
export const requestDetailsCache = Lazy(() => newCacheSection('requestDetails', ONE_HOUR_TTL))
