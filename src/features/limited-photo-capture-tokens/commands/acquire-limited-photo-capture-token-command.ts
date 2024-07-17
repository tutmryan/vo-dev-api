import { getClientCredentialsToken } from '@makerx/node-common'
import { setLimitedPhotoCaptureData } from '..'
import { limitedPhotoCaptureAuth } from '../../../config'
import type { CommandContext } from '../../../cqs'
import type { AcquireLimitedPhotoCaptureTokenInput, PhotoCaptureTokenResponse } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { getPhotoCaptureRequest } from '../../photo-capture'

export async function AcquireLimitedPhotoCaptureTokenCommand(
  this: CommandContext,
  input: AcquireLimitedPhotoCaptureTokenInput,
): Promise<PhotoCaptureTokenResponse> {
  invariant(input.photoCaptureRequestId, 'Photo capture request ID is required')

  // check the photo capture request exists
  const photoCaptureRequest = await getPhotoCaptureRequest(input.photoCaptureRequestId)
  if (!photoCaptureRequest) throw new Error('The specified photo capture request does not exist')

  // acquire a token and store the request data against the token for subsequent retrieval by token
  const token = await getClientCredentialsToken(limitedPhotoCaptureAuth)
  await setLimitedPhotoCaptureData(token.access_token, photoCaptureRequest)

  return {
    token: token.access_token,
    expires: token.expires,
  }
}
