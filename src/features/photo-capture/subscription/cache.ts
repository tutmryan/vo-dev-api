import { newCacheSection } from '../../../cache'
import type { PhotoCaptureTopicData } from './pubsub'

const PHOTO_CAPTURE_EVENT_DATA_TTL = 30 * 60 // 30 minutes
const cache = newCacheSection('completedPhotoCaptureEventCache')

export const addPhotoCaptureEventDataToCache = (data: PhotoCaptureTopicData) =>
  cache.set(data.photoCaptureRequestId, JSON.stringify(data), {
    ttl: PHOTO_CAPTURE_EVENT_DATA_TTL,
  })

export async function getPhotoCaptureEventDataFromCache(photoCaptureRequestId: string) {
  const data = await cache.get(photoCaptureRequestId)
  if (!data) return undefined
  return JSON.parse(data) as PhotoCaptureTopicData
}
