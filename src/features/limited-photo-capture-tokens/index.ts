import { limitedPhotoCapture } from '../../config'
import type { PhotoCaptureRequest } from '../../generated/graphql'
import { createKey } from '../../util/token'
import { photoCaptureRequestCache } from '../photo-capture'

export async function setLimitedPhotoCaptureData(token: string, data: PhotoCaptureRequest): Promise<void> {
  const key = getLimitedPhotoCaptureKey(token)
  await setLimitedPhotoCaptureDataByKey(key, data)
}

export async function setLimitedPhotoCaptureDataByKey(key: string, data: PhotoCaptureRequest): Promise<void> {
  await photoCaptureRequestCache.set(key, JSON.stringify(data), { ttl: 60 * 60 }) // 1 hour - access tokens are valid for 50 minutes
}

export const getLimitedPhotoCaptureKey = (token: string) => createKey(token, limitedPhotoCapture.secret)
