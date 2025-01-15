import KeyvRedis from '@keyv/redis'
import { newCacheSection } from '../../redis/cache'
import { rateLimiter } from '../../redis/rate-limiter'
import { Lazy } from '../../util/lazy'

export const codeExpiryMinutes = 5

const CACHE_TTL = 1000 * 60 * codeExpiryMinutes
const verificationCache = Lazy(() => newCacheSection('asyncIssuanceVerificationCache', CACHE_TTL))

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
const verificationThrottleCache = Lazy(() => newCacheSection('verificationThrottle', VERIFICATION_THROTTLE_TTL))
function getVerificationThrottleKey(asyncIssuanceId: string) {
  return `asyncIssuanceVerification:${asyncIssuanceId.toLowerCase()}`
}

export async function clearVerificationThrottleForIssuance(asyncIssuanceId: string) {
  const throttleKey = getVerificationThrottleKey(asyncIssuanceId)
  await verificationThrottleCache().delete(throttleKey)
}

export async function isThrottledOrSetThrottle(asyncIssuanceId: string): Promise<boolean> {
  const keyv = verificationThrottleCache()
  const store = keyv.opts.store
  const throttleKey = getVerificationThrottleKey(asyncIssuanceId)

  if (store instanceof KeyvRedis) {
    const redisClient = store.redis
    // Atomic
    const result = await redisClient.set(throttleKey, true.toString(), 'NX', 'PX', VERIFICATION_THROTTLE_TTL)
    return result === null
  } else {
    // Non-atomic fallback for other store types (e.g., memory, SQLite, etc.). This is prone to race conditions
    const existing = await keyv.get(throttleKey)
    if (existing) {
      return true
    }
    await keyv.set(throttleKey, true.toString())
    return false
  }
}
