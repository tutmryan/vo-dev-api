import { limitedPresentationFlow } from '../../config'
import type { AcquireLimitedPresentationFlowTokenInput } from '../../generated/graphql'
import { newCacheSection, ONE_HOUR_TTL } from '../../redis/cache'
import { Lazy } from '../../util/lazy'
import { createKey } from '../../util/token'

const limitedPresentationFlowCache = Lazy(() => newCacheSection('limitedPresentationFlow', ONE_HOUR_TTL)) // 1 hour - access tokens are valid for 50 minutes + 10 minute buffer

export type LimitedPresentationFlowTokenData = AcquireLimitedPresentationFlowTokenInput & {
  userId: string
  presentationId?: string
}

export async function getLimitedPresentationFlowTokenData(token: string): Promise<LimitedPresentationFlowTokenData> {
  const key = getLimitedPresentationFlowKey(token)
  return await getLimitedPresentationFlowTokenDataByKey(key)
}

export async function getLimitedPresentationFlowTokenDataByKey(key: string): Promise<LimitedPresentationFlowTokenData> {
  const data = await limitedPresentationFlowCache().get(key)
  if (!data) throw new Error('Invalid token')
  return JSON.parse(data)
}

export async function setLimitedPresentationFlowTokenData(token: string, data: LimitedPresentationFlowTokenData): Promise<void> {
  const key = getLimitedPresentationFlowKey(token)
  await setLimitedPresentationFlowTokenDataByKey(key, data)
}

export async function setLimitedPresentationFlowTokenDataByKey(key: string, data: LimitedPresentationFlowTokenData): Promise<void> {
  await limitedPresentationFlowCache().set(key, JSON.stringify(data))
}

export const getLimitedPresentationFlowKey = (token: string) => createKey(token, limitedPresentationFlow.secret)
