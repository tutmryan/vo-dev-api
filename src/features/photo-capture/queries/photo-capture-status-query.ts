import type { QueryContext } from '../../../cqs'
import { type PhotoCaptureEventData } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { getPhotoCaptureEventDataFromCache } from '../subscription/cache'

export async function PhotoCaptureStatusQuery(this: QueryContext, photoCaptureRequestId: string): Promise<PhotoCaptureEventData> {
  const data = await getPhotoCaptureEventDataFromCache(photoCaptureRequestId)
  invariant(data, 'The requested photo capture request was not found or was completed some time ago')
  return data.eventData
}
