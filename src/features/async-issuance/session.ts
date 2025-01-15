import { limitedAsyncIssuance } from '../../config'
import { ONE_HOUR_TTL, newCacheSection } from '../../redis/cache'
import { Lazy } from '../../util/lazy'
import { createKey } from '../../util/token'
import type { AsyncIssuanceEntity } from './entities/async-issuance-entity'

export const ISSUANCE_SESSION_TTL = ONE_HOUR_TTL
// cache of async issuance data by async issuance request id
const asyncIssuanceCache = Lazy(() => newCacheSection('asyncIssuance', ISSUANCE_SESSION_TTL))
// cache of async issuance request id by token key
const asyncIssuanceSessionCache = Lazy(() => newCacheSection('asyncIssuanceSession', ISSUANCE_SESSION_TTL))

export type AsyncIssuanceSessionData = Pick<AsyncIssuanceEntity, 'contractId' | 'identityId'> & {
  asyncIssuanceRequestId: string
  userId: string
  issuanceRequestId?: string
  photoCapture?: boolean
  photoCaptureRequestId?: string
}

export async function setAsyncIssuanceSessionData(token: string, data: AsyncIssuanceSessionData) {
  const key = getAsyncIssuanceSessionKey(token)
  await asyncIssuanceSessionCache().set(key, data.asyncIssuanceRequestId)
  await asyncIssuanceCache().set(data.asyncIssuanceRequestId, JSON.stringify(data))
}

export async function getAsyncIssuanceDataForSession(token: string) {
  const key = getAsyncIssuanceSessionKey(token)
  return getAsyncIssuanceDataBySessionKey(key)
}

export async function getAsyncIssuanceDataBySessionKey(sessionKey: string) {
  const asyncIssuanceRequestId = await asyncIssuanceSessionCache().get(sessionKey)
  if (!asyncIssuanceRequestId) return undefined
  return getAsyncIssuanceData(asyncIssuanceRequestId)
}

export async function getAsyncIssuanceData(asyncIssuanceRequestId: string) {
  const data = await asyncIssuanceCache().get(asyncIssuanceRequestId)
  if (!data) return undefined
  return JSON.parse(data) as AsyncIssuanceSessionData
}

export const getAsyncIssuanceSessionKey = (token: string) => createKey(token, limitedAsyncIssuance.secret)
