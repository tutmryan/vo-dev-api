import { randomUUID } from 'crypto'
import QRCode from 'qrcode'
import { setPhotoCaptureData } from '..'
import { portalUrl } from '../../../config'
import type { CommandContext } from '../../../cqs'
import { PhotoCaptureStatus, type PhotoCaptureRequest, type PhotoCaptureRequestResponse } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { addPhotoCaptureEventDataToCache } from '../subscription/cache'

const qrCodeImageWidth = 292 // same size as Microsoft VID QR codes

export async function CreatePhotoCaptureRequestCommand(
  this: CommandContext,
  { identityId: requestIdentityId, ...request }: PhotoCaptureRequest,
): Promise<PhotoCaptureRequestResponse> {
  const { user, entityManager } = this
  userInvariant(user)

  // consume identityId from limited access data OR input
  const identityId = user.limitedAccessData?.identityId ?? requestIdentityId
  invariant(identityId, 'identityId is required unless using a limited access token')

  // validate input
  await entityManager.getRepository(ContractEntity).findOneByOrFail({ id: request.contractId })
  await entityManager.getRepository(IdentityEntity).findOneByOrFail({ id: identityId })

  // persist photo capture data in cache for subsequent retrieval
  const photoCaptureRequestId = randomUUID()
  await setPhotoCaptureData(photoCaptureRequestId, { ...request, identityId, photoCaptureRequestId, userId: user.entity.id })

  // generate URL and QR code for photo capture
  const photoCaptureUrl = `${portalUrl}/photo-capture/${photoCaptureRequestId}`
  const photoCaptureQrCode = await QRCode.toDataURL(photoCaptureUrl, { width: qrCodeImageWidth })

  // add initial photo capture status data to cache
  await addPhotoCaptureEventDataToCache({ photoCaptureRequestId, eventData: { status: PhotoCaptureStatus.NotStarted } })

  return {
    id: photoCaptureRequestId,
    photoCaptureUrl,
    photoCaptureQrCode,
  }
}
