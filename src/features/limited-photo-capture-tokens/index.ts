import { limitedPhotoCapture } from '../../config'
import { createKey } from '../../util/token'
import { photoCaptureCache } from '../photo-capture'

export async function setLimitedPhotoCaptureSession(token: string, photoCaptureRequestId: string) {
  const key = getLimitedPhotoCaptureKey(token)
  await setLimitedPhotoCaptureSessionByKey(key, photoCaptureRequestId)
}

async function setLimitedPhotoCaptureSessionByKey(key: string, photoCaptureRequestId: string) {
  await photoCaptureCache.set(key, photoCaptureRequestId, { ttl: 60 * 60 }) // 1 hour - access tokens are valid for 50 minutes + 10 minute buffer
}

export async function deleteLimitedPhotoCaptureSession(token: string) {
  const key = getLimitedPhotoCaptureKey(token)
  await photoCaptureCache.delete(key)
}

export async function getLimitedPhotoCaptureSession(token: string) {
  const key = getLimitedPhotoCaptureKey(token)
  return await photoCaptureCache.get(key)
}

const getLimitedPhotoCaptureKey = (token: string) => createKey(token, limitedPhotoCapture.secret)
