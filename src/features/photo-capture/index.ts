import { newCacheSection } from '../../cache'
import type { PhotoCaptureRequest } from '../../generated/graphql'
import type { NonNullableFields, WithRequired } from '../../util/type-helpers'

export const photoCaptureCache = newCacheSection('photoCaptureCache')

export type PhotoCaptureData = NonNullableFields<WithRequired<PhotoCaptureRequest, 'identityId'>> & {
  photoCaptureRequestId: string
  userId: string
  photo?: string
}

export async function setPhotoCaptureData(id: string, data: PhotoCaptureData) {
  await photoCaptureCache.set(id, JSON.stringify(data))
}

export async function getPhotoCaptureData(id: string): Promise<PhotoCaptureData | undefined> {
  const data = await photoCaptureCache.get(id)
  if (!data) return undefined
  return JSON.parse(data) as PhotoCaptureData
}

export async function deletePhotoCaptureRequest(id: string) {
  await photoCaptureCache.delete(id)
}
