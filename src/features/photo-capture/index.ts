import { newCacheSection } from '../../cache'
import type { PhotoCaptureRequest } from '../../generated/graphql'

export const photoCaptureRequestCache = newCacheSection('photoCaptureRequest')

export async function setPhotoCaptureRequest(id: string, request: PhotoCaptureRequest) {
  await photoCaptureRequestCache.set(id, JSON.stringify(request))
}

export async function getPhotoCaptureRequest(id: string): Promise<PhotoCaptureRequest | undefined> {
  const data = await photoCaptureRequestCache.get(id)
  if (!data) return undefined
  return JSON.parse(data) as PhotoCaptureRequest
}

export async function deletePhotoCaptureRequest(id: string) {
  await photoCaptureRequestCache.delete(id)
}
