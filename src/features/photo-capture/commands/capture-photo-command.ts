import { setPhotoCaptureData } from '..'
import type { CommandContext } from '../../../cqs'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { convertFaceCheckPhoto } from '../../issuance/commands/create-issuance-request-command'
import { completeLimitedPhotoCaptureSession } from '../../limited-photo-capture-tokens'

export async function CapturePhotoCommand(this: CommandContext, photoCaptureRequestId: string, photo: string): Promise<void> {
  const { user } = this
  userInvariant(user)

  // validate that user photo capture data matches the specified photo capture ID
  invariant(user.limitedPhotoCaptureData, 'There is no active photo capture session for this user')
  invariant(user.limitedPhotoCaptureData.photoCaptureRequestId === photoCaptureRequestId, 'The photoCaptureRequestId is not valid')

  // validate the photo has not been captured
  invariant(user.limitedPhotoCaptureData.photo === undefined, 'The photo has already been captured for this request')

  // convert the photo
  const base64Url = convertFaceCheckPhoto(photo)

  // persist the photo for subsequent retrieval
  user.limitedPhotoCaptureData.photo = base64Url
  await setPhotoCaptureData(photoCaptureRequestId, user.limitedPhotoCaptureData)
  await completeLimitedPhotoCaptureSession(user.token, photoCaptureRequestId)
}
