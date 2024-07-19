import { randomUUID } from 'crypto'
import QRCode from 'qrcode'
import { setPhotoCaptureData } from '..'
import { portalUrl } from '../../../config'
import type { CommandContext } from '../../../cqs'
import type { PhotoCaptureRequest, PhotoCaptureRequestResponse } from '../../../generated/graphql'
import { userInvariant } from '../../../util/user-invariant'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { IdentityEntity } from '../../identity/entities/identity-entity'

export async function CreatePhotoCaptureRequestCommand(
  this: CommandContext,
  request: PhotoCaptureRequest,
): Promise<PhotoCaptureRequestResponse> {
  const { user, entityManager } = this
  userInvariant(user)

  // validate input
  await entityManager.getRepository(ContractEntity).findOneByOrFail({ id: request.contractId })
  await entityManager.getRepository(IdentityEntity).findOneByOrFail({ id: request.identityId })

  // persist photo capture data in cache for subsequent retrieval
  const photoCaptureRequestId = randomUUID()
  await setPhotoCaptureData(photoCaptureRequestId, { ...request, photoCaptureRequestId, userId: user.userEntity.id })

  // generate URL and QR code for photo capture
  const photoCaptureUrl = `${portalUrl}/photo-capture/${photoCaptureRequestId}`
  const photoCaptureQrCode = await QRCode.toDataURL(photoCaptureUrl)

  return {
    id: photoCaptureRequestId,
    photoCaptureUrl,
    photoCaptureQrCode,
  }
}
