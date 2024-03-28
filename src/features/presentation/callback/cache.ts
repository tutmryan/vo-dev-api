import { newCacheSection } from '../../../cache'
import type { PresentationTopicData } from './pubsub'

export const PRESENTATION_DATA_TTL = 30 * 60 // 30 minutes
const presentationCache = newCacheSection('presentationCache')

export const addPresentationDataToCache = (data: PresentationTopicData) =>
  presentationCache.set(data.event.requestId, JSON.stringify(data), {
    ttl: PRESENTATION_DATA_TTL,
  })

export async function getPresentationDataFromCache(requestId: string) {
  const data = await presentationCache.get(requestId)
  if (!data) return
  return JSON.parse(data) as PresentationTopicData
}
