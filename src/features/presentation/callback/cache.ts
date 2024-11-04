import { newCacheSection, ONE_MINUTE_TTL } from '../../../redis/cache'
import { Lazy } from '../../../util/lazy'
import type { PresentationTopicData } from './pubsub'

export const PRESENTATION_DATA_TTL = ONE_MINUTE_TTL * 30 // 30 minutes
const presentationCache = Lazy(() => newCacheSection('presentationCache', PRESENTATION_DATA_TTL))

export const addPresentationDataToCache = (data: PresentationTopicData) =>
  presentationCache().set(data.event.requestId, JSON.stringify(data))

export async function getPresentationDataFromCache(requestId: string) {
  const data = await presentationCache().get(requestId)
  if (!data) return
  return JSON.parse(data) as PresentationTopicData
}
