import { getClientCredentialsToken } from '@makerx/node-common'
import { randomUUID } from 'crypto'
import type { LimitedAsyncIssuanceData } from '..'
import { acquireAsyncIssuanceTokenLimiter, getLimitedAsyncIssuanceData, redeemVerificationCode, setLimitedAsyncIssuanceData } from '..'
import { requestDetailsCache } from '../../../cache'
import { limitedAsyncIssuanceAuth } from '../../../config'
import type { CommandContext } from '../../../cqs'
import type { AsyncIssuanceTokenResponse } from '../../../generated/graphql'
import { IssuanceRequestStatus } from '../../../generated/graphql'
import { consumeRateLimit } from '../../../rate-limiter'
import { invariant } from '../../../util/invariant'
import { AsyncIssuanceEntity } from '../../async-issuance/entities/async-issuance-entity'
import { publishIssuanceEvent } from '../../issuance/callback/pubsub'
import type { IssuanceRequestDetails } from '../../issuance/commands/create-issuance-request-command'
import { createLimitedPhotoCaptureSession } from '../../limited-photo-capture-tokens'
import type { PhotoCaptureData } from '../../photo-capture'
import { setPhotoCaptureData } from '../../photo-capture'

export async function AcquireAsyncIssuanceTokenCommand(
  this: CommandContext,
  asyncIssuanceRequestId: string,
  verificationCode: string,
): Promise<AsyncIssuanceTokenResponse> {
  const { entityManager, requestInfo } = this

  // rate limit by async issuance request id
  await consumeRateLimit(acquireAsyncIssuanceTokenLimiter, asyncIssuanceRequestId, requestInfo, 'Too many attempts on this issuance')

  // check + clear verification code
  const isValid = await redeemVerificationCode(asyncIssuanceRequestId, verificationCode)
  invariant(isValid, 'Invalid verification code')

  // validate async issuance entity state
  const entity = await entityManager.getRepository(AsyncIssuanceEntity).findOneByOrFail({ id: asyncIssuanceRequestId })
  invariant(!entity.isStatusFinal, 'Invalid async issuance state for issuance')

  // download the async issuance request
  const asyncIssuanceRequest = await this.services.asyncIssuances.downloadAsyncIssuance(asyncIssuanceRequestId, entity.expiry)
  invariant(asyncIssuanceRequest, 'Async issuance request data not found')

  // terminate any existing in-progress issuance request
  const existingSessionData = await getLimitedAsyncIssuanceData(asyncIssuanceRequestId)
  if (existingSessionData?.issuanceRequestId) terminateInProgressIssuanceRequest(existingSessionData.issuanceRequestId)

  // acquire a token
  const token = await getClientCredentialsToken(limitedAsyncIssuanceAuth)

  // store the async issuance data required to apply operation authorisation against the token for subsequent retrieval (by token)
  const limitedAsyncIssuanceData: LimitedAsyncIssuanceData = {
    asyncIssuanceRequestId,
    contractId: entity.contractId,
    identityId: entity.identityId,
    userId: entity.createdById,
    photoCapture: asyncIssuanceRequest.photoCapture ?? false,
    photoCaptureRequestId: asyncIssuanceRequest.photoCapture ? randomUUID() : undefined,
  }
  await setLimitedAsyncIssuanceData(token.access_token, limitedAsyncIssuanceData)

  // create a photo capture session if this async issuance requires it
  if (limitedAsyncIssuanceData.photoCaptureRequestId) {
    const photoCaptureData: PhotoCaptureData = {
      photoCaptureRequestId: limitedAsyncIssuanceData.photoCaptureRequestId,
      contractId: entity.contractId,
      identityId: entity.identityId,
      userId: entity.createdById,
    }
    await setPhotoCaptureData(limitedAsyncIssuanceData.photoCaptureRequestId, photoCaptureData)
    await createLimitedPhotoCaptureSession(token.access_token, limitedAsyncIssuanceData.photoCaptureRequestId)
  }

  return {
    token: token.access_token,
    expires: token.expires,
    photoCaptureRequestId: limitedAsyncIssuanceData.photoCaptureRequestId,
  }
}

async function terminateInProgressIssuanceRequest(issuanceRequestId: string) {
  // look up the issuance request details
  const requestDetails = await requestDetailsCache.get(issuanceRequestId)
  invariant(requestDetails, 'Issuance request details not found')
  const issuanceRequestDetails = JSON.parse(requestDetails) as IssuanceRequestDetails
  // delete existing request details
  await requestDetailsCache.delete(issuanceRequestId)
  // publish issuance error event to notify subscribers
  await publishIssuanceEvent({
    ...issuanceRequestDetails,
    event: {
      error: {
        code: 'async-issuance-error',
        message: 'A new remote issuance session was started',
      },
      requestId: issuanceRequestId,
      requestStatus: IssuanceRequestStatus.IssuanceError,
    },
  })
}
