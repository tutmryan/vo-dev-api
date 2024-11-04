import { limitedPhotoCapture } from '../../config'
import { PhotoCaptureStatus } from '../../generated/graphql'
import { createKey } from '../../util/token'
import { photoCaptureCache } from '../photo-capture'
import { publishPhotoCaptureEvent } from '../photo-capture/subscription/pubsub'

export async function createLimitedPhotoCaptureSession(token: string, photoCaptureRequestId: string) {
  const key = getLimitedPhotoCaptureKey(token)
  await setLimitedPhotoCaptureSessionByKey(key, photoCaptureRequestId)
  await publishPhotoCaptureEvent({ photoCaptureRequestId, eventData: { status: PhotoCaptureStatus.Started } })
}

async function setLimitedPhotoCaptureSessionByKey(key: string, photoCaptureRequestId: string) {
  await photoCaptureCache().set(key, photoCaptureRequestId)
}

export async function completeLimitedPhotoCaptureSession(token: string, photoCaptureRequestId: string) {
  const key = getLimitedPhotoCaptureKey(token)
  await photoCaptureCache().delete(key)
  await publishPhotoCaptureEvent({ photoCaptureRequestId, eventData: { status: PhotoCaptureStatus.Complete } })
}

export async function getLimitedPhotoCaptureSession(token: string) {
  const key = getLimitedPhotoCaptureKey(token)
  return await photoCaptureCache().get(key)
}

const getLimitedPhotoCaptureKey = (token: string) => createKey(token, limitedPhotoCapture.secret)
