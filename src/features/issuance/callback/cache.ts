import { newCacheSection, ONE_MINUTE_TTL } from '../../../redis/cache'
import { Lazy } from '../../../util/lazy'
import type { IssuanceTopicData } from './pubsub'

const ISSUANCE_DATA_TTL = ONE_MINUTE_TTL * 30 // 30 minutes
const issuanceCache = Lazy(() => newCacheSection('issuanceCache', ISSUANCE_DATA_TTL))

export const addIssuanceDataToCache = (data: IssuanceTopicData) => issuanceCache().set(data.event.requestId, JSON.stringify(data))

export async function getIssuanceDataFromCache(requestId: string) {
  const data = await issuanceCache().get(requestId)
  if (!data) return
  return JSON.parse(data) as IssuanceTopicData
}
