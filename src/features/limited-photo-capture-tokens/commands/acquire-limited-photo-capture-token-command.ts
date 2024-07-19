import { getClientCredentialsToken } from '@makerx/node-common'
import { setLimitedPhotoCaptureSession } from '..'
import { limitedPhotoCaptureAuth } from '../../../config'
import type { CommandContext } from '../../../cqs'
import type { AcquireLimitedPhotoCaptureTokenInput, PhotoCaptureTokenResponse } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { getPhotoCaptureData } from '../../photo-capture'

export async function AcquireLimitedPhotoCaptureTokenCommand(
  this: CommandContext,
  input: AcquireLimitedPhotoCaptureTokenInput,
): Promise<PhotoCaptureTokenResponse> {
  invariant(input.photoCaptureRequestId, 'Photo capture request ID is required')

  // check the photo capture request exists
  const photoCaptureRequest = await getPhotoCaptureData(input.photoCaptureRequestId)
  invariant(photoCaptureRequest, 'The specified photo capture request does not exist')
  invariant(photoCaptureRequest.photo === undefined, 'The photo has already been captured for this request')

  // acquire a token and store the request reference against the token for subsequent retrieval (by token)
  const token = await getClientCredentialsToken(limitedPhotoCaptureAuth)
  await setLimitedPhotoCaptureSession(token.access_token, input.photoCaptureRequestId)

  return {
    token: token.access_token,
    expires: token.expires,
  }
}
