import { newCacheSection } from '../../cache'
import { limitedAsyncIssuance } from '../../config'
import { rateLimiter } from '../../redis'
import { createKey } from '../../util/token'
import type { AsyncIssuanceEntity } from '../async-issuance/entities/async-issuance-entity'

export const codeExpiryMinutes = 5
const verificationCache = newCacheSection('asyncIssuanceVerificationCache')

export const acquireAsyncIssuanceTokenLimiter = rateLimiter({
  points: 10,
  duration: 60 * codeExpiryMinutes,
  keyPrefix: 'rate-limit-otp',
  inMemoryBlockOnConsumed: 10,
})

export async function setVerificationCode(asyncIssuanceRequestId: string, verificationCode: string) {
  await acquireAsyncIssuanceTokenLimiter.delete(asyncIssuanceRequestId)
  return verificationCache.set(asyncIssuanceRequestId, verificationCode, { ttl: 60 * codeExpiryMinutes })
}

export async function redeemVerificationCode(asyncIssuanceRequestId: string, verificationCode: string): Promise<boolean> {
  const code = await verificationCache.get(asyncIssuanceRequestId)
  const isValid = code === verificationCode
  if (isValid) {
    await verificationCache.delete(asyncIssuanceRequestId)
    await clearVerificationThrottleForIssuance(asyncIssuanceRequestId)
    await acquireAsyncIssuanceTokenLimiter.delete(asyncIssuanceRequestId)
  }
  return isValid
}

export const issuanceSessionExpiryMinutes = 60
// cache of async issuance data by async issuance request id
const asyncIssuanceCache = newCacheSection('asyncIssuance')
// cache of async issuance request id by token key
const asyncIssuanceSessionCache = newCacheSection('asyncIssuanceSession')

export type LimitedAsyncIssuanceData = Pick<AsyncIssuanceEntity, 'contractId' | 'identityId'> & {
  asyncIssuanceRequestId: string
  userId: string
  issuanceRequestId?: string
  photoCapture?: boolean
  photoCaptureRequestId?: string
}

export async function setLimitedAsyncIssuanceData(token: string, data: LimitedAsyncIssuanceData) {
  const key = getLimitedAsyncIssuanceSessionKey(token)
  await asyncIssuanceSessionCache.set(key, data.asyncIssuanceRequestId, { ttl: 60 * issuanceSessionExpiryMinutes })
  await asyncIssuanceCache.set(data.asyncIssuanceRequestId, JSON.stringify(data), { ttl: 60 * issuanceSessionExpiryMinutes })
}

export async function getLimitedAsyncIssuanceDataForSession(token: string) {
  const key = getLimitedAsyncIssuanceSessionKey(token)
  return getLimitedAsyncIssuanceDataBySessionKey(key)
}

export async function getLimitedAsyncIssuanceDataBySessionKey(sessionKey: string) {
  const asyncIssuanceRequestId = await asyncIssuanceSessionCache.get(sessionKey)
  if (!asyncIssuanceRequestId) return undefined
  return getLimitedAsyncIssuanceData(asyncIssuanceRequestId)
}

export async function getLimitedAsyncIssuanceData(asyncIssuanceRequestId: string) {
  const data = await asyncIssuanceCache.get(asyncIssuanceRequestId)
  if (!data) return undefined
  return JSON.parse(data) as LimitedAsyncIssuanceData
}

export const getLimitedAsyncIssuanceSessionKey = (token: string) => createKey(token, limitedAsyncIssuance.secret)

const verificationThrottleSeconds = 120 - 1 // 2 minutes - 1 second for buffer
const verificationThrottleCache = newCacheSection('verificationThrottle')
function getVerificationThrottleKey(asyncIssuanceId: string) {
  return `asyncIssuanceVerification:${asyncIssuanceId}`
}

export async function throttleVerificationForIssuance(asyncIssuanceId: string) {
  const throttleKey = getVerificationThrottleKey(asyncIssuanceId)
  await verificationThrottleCache.set(throttleKey, true.toString(), { ttl: verificationThrottleSeconds })
}

export async function clearVerificationThrottleForIssuance(asyncIssuanceId: string) {
  const throttleKey = getVerificationThrottleKey(asyncIssuanceId)
  await verificationThrottleCache.delete(throttleKey)
}

export async function isAsyncIssuanceVerificationThrottled(asyncIssuanceId: string) {
  const throttleKey = getVerificationThrottleKey(asyncIssuanceId)
  const throttleEntry = await verificationThrottleCache.get(throttleKey)
  return !!throttleEntry
}
