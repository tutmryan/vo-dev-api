import { AuditEvents } from '../../../audit-types'
import type { CommandContext } from '../../../cqs'
import { isFaceCheckPhotoEnabled, registerFeatureCheck } from '../../../cqs/feature-map'
import type { IssuanceRequestInput } from '../../../generated/graphql'
import { requestDetailsCache } from '../../callback/cache'
import { CredentialRecordEntity } from '../../credential-record/entities/credential-record-entity'
import type { IssuanceEntity } from '../entities/issuance-entity'
import { executeIssuanceRequest } from './execute-issuance-request'
export { convertFaceCheckPhoto, convertImageClaimInput, validateFaceCheckPhoto, validateImageClaimInput } from './execute-issuance-request'

export type IssuanceRequestDetails = Pick<
  IssuanceEntity,
  'id' | 'issuedById' | 'identityId' | 'contractId' | 'hasFaceCheckPhoto' | 'credentialRecordId'
> &
  Pick<IssuanceRequestInput, 'expirationDate' | 'photoCaptureRequestId'> & {
    asyncIssuanceKey?: string
  }

registerFeatureCheck(CreateIssuanceRequestCommand, async (...[, input]) => isFaceCheckPhotoEnabled(input))

export async function CreateIssuanceRequestCommand(this: CommandContext, input: IssuanceRequestInput) {
  const { entityManager } = this

  const result = await executeIssuanceRequest(this, input)

  if ('error' in result) return result

  const { requestResponse, issuanceId, issuedById, identity, contract, hasFaceCheckPhoto, expirationDate, photoCaptureRequestId } = result

  const credentialRecord = new CredentialRecordEntity()
  credentialRecord.createdById = issuedById
  credentialRecord.contractId = contract.id
  credentialRecord.identityId = identity.id
  // expiresAt is the offer/QR-code expiry time: the Unix-seconds timestamp returned by the
  // Entra Verified ID service (typically 5 minutes from now).
  credentialRecord.expiresAt = new Date(requestResponse.expiry * 1000)
  await entityManager.getRepository(CredentialRecordEntity).save(credentialRecord)

  const requestDetails: IssuanceRequestDetails = {
    id: issuanceId,
    issuedById,
    identityId: identity.id,
    contractId: contract.id,
    expirationDate,
    photoCaptureRequestId,
    hasFaceCheckPhoto,
    credentialRecordId: credentialRecord.id,
  }
  await requestDetailsCache().set(requestResponse.requestId, JSON.stringify(requestDetails))

  this.logger.auditEvent(AuditEvents.ISSUANCE_REQUEST_CREATED, { requestId: requestResponse.requestId })

  requestResponse.credentialRecordId = credentialRecord.id

  return requestResponse
}
