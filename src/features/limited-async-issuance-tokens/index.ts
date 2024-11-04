import { limitedAsyncIssuance } from '../../config'
import { newCacheSection, ONE_HOUR_TTL } from '../../redis/cache'
import { rateLimiter } from '../../redis/rate-limiter'
import { Lazy } from '../../util/lazy'
import { createKey } from '../../util/token'
import type { AsyncIssuanceEntity } from '../async-issuance/entities/async-issuance-entity'

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

export const ISSUANCE_SESSION_TTL = ONE_HOUR_TTL
// cache of async issuance data by async issuance request id
const asyncIssuanceCache = Lazy(() => newCacheSection('asyncIssuance', ISSUANCE_SESSION_TTL))
// cache of async issuance request id by token key
const asyncIssuanceSessionCache = Lazy(() => newCacheSection('asyncIssuanceSession', ISSUANCE_SESSION_TTL))

export type LimitedAsyncIssuanceData = Pick<AsyncIssuanceEntity, 'contractId' | 'identityId'> & {
  asyncIssuanceRequestId: string
  userId: string
  issuanceRequestId?: string
  photoCapture?: boolean
  photoCaptureRequestId?: string
}

export async function setLimitedAsyncIssuanceData(token: string, data: LimitedAsyncIssuanceData) {
  const key = getLimitedAsyncIssuanceSessionKey(token)
  await asyncIssuanceSessionCache().set(key, data.asyncIssuanceRequestId)
  await asyncIssuanceCache().set(data.asyncIssuanceRequestId, JSON.stringify(data))
}

export async function getLimitedAsyncIssuanceDataForSession(token: string) {
  const key = getLimitedAsyncIssuanceSessionKey(token)
  return getLimitedAsyncIssuanceDataBySessionKey(key)
}

export async function getLimitedAsyncIssuanceDataBySessionKey(sessionKey: string) {
  const asyncIssuanceRequestId = await asyncIssuanceSessionCache().get(sessionKey)
  if (!asyncIssuanceRequestId) return undefined
  return getLimitedAsyncIssuanceData(asyncIssuanceRequestId)
}

export async function getLimitedAsyncIssuanceData(asyncIssuanceRequestId: string) {
  const data = await asyncIssuanceCache().get(asyncIssuanceRequestId)
  if (!data) return undefined
  return JSON.parse(data) as LimitedAsyncIssuanceData
}

export const getLimitedAsyncIssuanceSessionKey = (token: string) => createKey(token, limitedAsyncIssuance.secret)

const VERIFICATION_THROTTLE_TTL = 1000 * 120 - 1 // 2 minutes - 1 second for buffer
const verificationThrottleCache = Lazy(() => newCacheSection('verificationThrottle', VERIFICATION_THROTTLE_TTL))
function getVerificationThrottleKey(asyncIssuanceId: string) {
  return `asyncIssuanceVerification:${asyncIssuanceId.toLowerCase()}`
}

export async function throttleVerificationForIssuance(asyncIssuanceId: string) {
  const throttleKey = getVerificationThrottleKey(asyncIssuanceId)
  await verificationThrottleCache().set(throttleKey, true.toString())
}

export async function clearVerificationThrottleForIssuance(asyncIssuanceId: string) {
  const throttleKey = getVerificationThrottleKey(asyncIssuanceId)
  await verificationThrottleCache().delete(throttleKey)
}

export async function isAsyncIssuanceVerificationThrottled(asyncIssuanceId: string) {
  const throttleKey = getVerificationThrottleKey(asyncIssuanceId)
  const throttleEntry = await verificationThrottleCache().get(throttleKey)
  return !!throttleEntry
}
