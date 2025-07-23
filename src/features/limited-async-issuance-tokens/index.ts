import KeyvRedis from '@keyv/redis'
import Redis from 'ioredis'
import { newCacheSection } from '../../redis/cache'
import { rateLimiter } from '../../redis/rate-limiter'
import { invariant } from '../../util/invariant'
import { Lazy } from '../../util/lazy'

export const codeExpiryMinutes = 5

const CACHE_TTL = 1000 * 60 * codeExpiryMinutes
const verificationCache = Lazy(() => newCacheSection('asyncIssuanceVerificationCache', CACHE_TTL))
const redisCacheClient = Lazy(() => {
  const cache = verificationCache()
  const store = cache.opts.store
  invariant(store instanceof KeyvRedis, 'Verification throttle cache must use Redis store for atomic operations')
  invariant(store.redis instanceof Redis, 'Verification throttle cache must use Redis store for atomic operations')
  return store.redis
})

export const acquireAsyncIssuanceTokenLimiter = Lazy(() =>
  rateLimiter({
    points: 10,
    duration: 60 * codeExpiryMinutes,
    keyPrefix: 'rate-limit-otp',
    inMemoryBlockOnConsumed: 10,
  }),
)

export async function setVerificationCode(asyncIssuanceRequestId: string, verificationCode: string) {
  const limiter = await acquireAsyncIssuanceTokenLimiter()
  await limiter.delete(asyncIssuanceRequestId)
  return verificationCache().set(asyncIssuanceRequestId, verificationCode)
}

export async function redeemVerificationCode(asyncIssuanceRequestId: string, verificationCode: string): Promise<boolean> {
  const code = await verificationCache().get(asyncIssuanceRequestId)
  const isValid = code === verificationCode
  if (isValid) {
    await verificationCache().delete(asyncIssuanceRequestId)
    await clearVerificationThrottleForIssuance(asyncIssuanceRequestId)
    const limiter = await acquireAsyncIssuanceTokenLimiter()
    await limiter.delete(asyncIssuanceRequestId)
  }
  return isValid
}

const VERIFICATION_THROTTLE_TTL = 1000 * 120 - 1 // 2 minutes - 1 second for buffer
function getVerificationThrottleKey(asyncIssuanceId: string) {
  return `asyncIssuanceVerification:${asyncIssuanceId.toLowerCase()}`
}

export async function clearVerificationThrottleForIssuance(asyncIssuanceId: string) {
  const throttleKey = getVerificationThrottleKey(asyncIssuanceId)
  const redis = redisCacheClient()
  await redis.del(throttleKey)
}

/**
 * Check if the async issuance ID is throttled or set a throttle.
 * @param asyncIssuanceId The async issuance ID to check.
 * @returns True if the ID is throttled, false otherwise.
 */
export async function isThrottledOrSetThrottle(asyncIssuanceId: string): Promise<boolean> {
  const throttleKey = getVerificationThrottleKey(asyncIssuanceId)
  const redis = redisCacheClient()
  const result = await redis.set(throttleKey, true.toString(), 'PX', VERIFICATION_THROTTLE_TTL, 'NX')
  return result !== 'OK' // If it returns 'OK', it means we set the key successfully, so not throttled
}
