import { newCacheSection } from '../../../cache'
import type { IssuanceTopicData } from './pubsub'

const ISSUANCE_DATA_TTL = 30 * 60 // 30 minutes
const issuanceCache = newCacheSection('issuanceCache')

export const addIssuanceDataToCache = (data: IssuanceTopicData) =>
  issuanceCache.set(data.event.requestId, JSON.stringify(data), {
    ttl: ISSUANCE_DATA_TTL,
  })

export async function getIssuanceDataFromCache(requestId: string) {
  const data = await issuanceCache.get(requestId)
  if (!data) return
  return JSON.parse(data) as IssuanceTopicData
}
