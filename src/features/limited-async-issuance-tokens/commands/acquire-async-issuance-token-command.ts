import { getClientCredentialsToken } from '@makerx/node-common'
import { randomUUID } from 'crypto'
import type { LimitedAsyncIssuanceData } from '..'
import { redeemVerificationCode, setLimitedAsyncIssuanceData } from '..'
import { limitedAsyncIssuanceAuth } from '../../../config'
import type { CommandContext } from '../../../cqs'
import type { AsyncIssuanceTokenResponse } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { AsyncIssuanceEntity } from '../../async-issuance/entities/async-issuance-entity'
import { createLimitedPhotoCaptureSession } from '../../limited-photo-capture-tokens'
import type { PhotoCaptureData } from '../../photo-capture'
import { setPhotoCaptureData } from '../../photo-capture'

export async function AcquireAsyncIssuanceTokenCommand(
  this: CommandContext,
  asyncIssuanceRequestId: string,
  verificationCode: string,
): Promise<AsyncIssuanceTokenResponse> {
  const { entityManager } = this

  // check + clear verification code
  const isValid = await redeemVerificationCode(asyncIssuanceRequestId, verificationCode)
  invariant(isValid, 'Invalid verification code')

  // validate async issuance entity state
  const entity = await entityManager.getRepository(AsyncIssuanceEntity).findOneByOrFail({ id: asyncIssuanceRequestId })
  invariant(entity.state === 'contacted', 'Invalid async issuance state for issuance')

  // download the async issuance request
  const asyncIssuanceRequest = await this.services.asyncIssuances.downloadAsyncIssuance(asyncIssuanceRequestId, entity.expiry)
  invariant(asyncIssuanceRequest, 'Async issuance request data not found')

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
