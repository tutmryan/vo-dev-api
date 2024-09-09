import { newCacheSection } from '../../cache'
import { limitedAsyncIssuance } from '../../config'
import { createKey } from '../../util/token'
import type { AsyncIssuanceEntity } from '../async-issuance/entities/async-issuance-entity'

export const codeExpiryMinutes = 5
const verificationCache = newCacheSection('asyncIssuanceVerificationCache')

export const issuanceSessionExpiryMinutes = 60
const asyncIssuanceCache = newCacheSection('asyncIssuance')

export async function setVerificationCode(asyncIssuanceRequestId: string, verificationCode: string) {
  return verificationCache.set(asyncIssuanceRequestId, verificationCode, { ttl: 60 * codeExpiryMinutes })
}

export async function redeemVerificationCode(asyncIssuanceRequestId: string, verificationCode: string): Promise<boolean> {
  const code = await verificationCache.get(asyncIssuanceRequestId)
  const isValid = code === verificationCode
  if (isValid) {
    await verificationCache.delete(asyncIssuanceRequestId)
    await clearVerificationThrottleForIssuance(asyncIssuanceRequestId)
  }
  return isValid
}

export type LimitedAsyncIssuanceData = Pick<AsyncIssuanceEntity, 'contractId' | 'identityId'> & {
  asyncIssuanceRequestId: string
  userId: string
  issuanceRequestId?: string
  photoCapture?: boolean
  photoCaptureRequestId?: string
}

export async function setLimitedAsyncIssuanceData(token: string, data: LimitedAsyncIssuanceData) {
  const key = getLimitedAsyncIssuanceKey(token)
  await asyncIssuanceCache.set(key, JSON.stringify(data), { ttl: 60 * issuanceSessionExpiryMinutes })
}

export async function getLimitedAsyncIssuanceData(token: string) {
  const key = getLimitedAsyncIssuanceKey(token)
  return getLimitedAsyncIssuanceDataByKey(key)
}

export async function getLimitedAsyncIssuanceDataByKey(key: string) {
  const data = await asyncIssuanceCache.get(key)
  if (!data) return undefined
  return JSON.parse(data) as LimitedAsyncIssuanceData
}

export async function deleteLimitedAsyncIssuanceData(asyncIssuanceKey: string) {
  await asyncIssuanceCache.delete(asyncIssuanceKey)
}

export const getLimitedAsyncIssuanceKey = (token: string) => createKey(token, limitedAsyncIssuance.secret)

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
