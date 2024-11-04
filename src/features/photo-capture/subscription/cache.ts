import { newCacheSection, ONE_MINUTE_TTL } from '../../../redis/cache'
import { Lazy } from '../../../util/lazy'
import type { PhotoCaptureTopicData } from './pubsub'

const PHOTO_CAPTURE_EVENT_DATA_TTL = ONE_MINUTE_TTL * 30 // 30 minutes
const cache = Lazy(() => newCacheSection('completedPhotoCaptureEventCache', PHOTO_CAPTURE_EVENT_DATA_TTL))

export const addPhotoCaptureEventDataToCache = (data: PhotoCaptureTopicData) =>
  cache().set(data.photoCaptureRequestId, JSON.stringify(data))

export async function getPhotoCaptureEventDataFromCache(photoCaptureRequestId: string) {
  const data = await cache().get(photoCaptureRequestId)
  if (!data) return undefined
  return JSON.parse(data) as PhotoCaptureTopicData
}
