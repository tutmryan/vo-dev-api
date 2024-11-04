import type { PhotoCaptureRequest } from '../../generated/graphql'
import { newCacheSection, ONE_HOUR_TTL } from '../../redis/cache'
import { Lazy } from '../../util/lazy'
import type { NonNullableFields, WithRequired } from '../../util/type-helpers'

export const photoCaptureCache = Lazy(() => newCacheSection('photoCaptureData', ONE_HOUR_TTL)) // 1 hour - access tokens are valid for 50 minutes + 10 minute buffer

export type PhotoCaptureData = NonNullableFields<WithRequired<PhotoCaptureRequest, 'identityId'>> & {
  photoCaptureRequestId: string
  userId: string
  photo?: string
}

export async function setPhotoCaptureData(id: string, data: PhotoCaptureData) {
  await photoCaptureCache().set(id, JSON.stringify(data))
}

export async function getPhotoCaptureData(id: string): Promise<PhotoCaptureData | undefined> {
  const data = await photoCaptureCache().get(id)
  if (!data) return undefined
  return JSON.parse(data) as PhotoCaptureData
}

export async function deletePhotoCaptureRequest(id: string) {
  await photoCaptureCache().delete(id)
}
