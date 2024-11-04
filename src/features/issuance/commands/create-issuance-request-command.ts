import { randomUUID } from 'crypto'
import { issuanceRequestRegistration } from '../../../config'
import type { CommandContext } from '../../../cqs'
import { isFaceCheckPhotoEnabled, registerFeatureCheck } from '../../../cqs/feature-map'
import { FaceCheckPhotoSupport, type IssuanceRequestInput } from '../../../generated/graphql'
import type { IssuanceRequest } from '../../../services/verified-id'
import { parseDataUrl } from '../../../util/data-url'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { requestDetailsCache } from '../../callback/cache'
import type { StandardClaims } from '../../contracts/claims'
import { validateIssuanceClaimsAgainstContractClaims } from '../../contracts/claims'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { createOrUpdateIdentity } from '../../identity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { deletePhotoCaptureRequest, getPhotoCaptureData } from '../../photo-capture'
import type { IssuanceEntity } from '../entities/issuance-entity'

export type IssuanceRequestDetails = Pick<IssuanceEntity, 'id' | 'issuedById' | 'identityId' | 'contractId' | 'hasFaceCheckPhoto'> &
  Pick<IssuanceRequestInput, 'expirationDate' | 'photoCaptureRequestId'> &
  AsyncIssuanceRequestDetails

type AsyncIssuanceRequestDetails = { asyncIssuanceKey?: string }

type StandardClaimsData = Record<StandardClaims, string>

registerFeatureCheck(CreateIssuanceRequestCommand, async (...[, input]) => isFaceCheckPhotoEnabled(input))

export async function CreateIssuanceRequestCommand(
  this: CommandContext,
  {
    contractId,
    identityId,
    identity: identityInput,
    claims: claimsInput,
    faceCheckPhoto,
    photoCaptureRequestId,
    asyncIssuanceKey,
    ...rest
  }: IssuanceRequestInput & AsyncIssuanceRequestDetails,
) {
  const {
    user,
    entityManager,
    services: { verifiedIdRequest: request, verifiedIdAdmin },
  } = this

  userInvariant(user)

  // find the contract
  const contract = await entityManager.getRepository(ContractEntity).findOneByOrFail({ id: contractId })
  invariant(contract.externalId, 'Contract must be provisioned before issuance')
  invariant(!contract.isDeprecated, 'Contract must not be deprecated')

  // validate that the provided claims include the required contract claims
  validateIssuanceClaimsAgainstContractClaims(claimsInput, contract.display.claims)

  // find the provisioned contract
  const provisionedContract = await verifiedIdAdmin.contract(contract.externalId)
  invariant(provisionedContract, 'Published contract could not be found')

  // validate the face check photo input
  if (contract.faceCheckSupport === FaceCheckPhotoSupport.Required) {
    invariant(
      faceCheckPhoto || photoCaptureRequestId,
      'Face check photo or using a photo capture request is required for issuance of this contract',
    )
  }

  if (contract.faceCheckSupport === FaceCheckPhotoSupport.None) {
    invariant(
      !faceCheckPhoto && !photoCaptureRequestId,
      'Contract must support face check when providing either a face check photo or using a photo capture request',
    )
  }

  // validate that there is either no image data (false, false) or the image data is from a single source (false, true) | (true, false)
  invariant(
    (!faceCheckPhoto && !photoCaptureRequestId) || (faceCheckPhoto && !photoCaptureRequestId) || (!faceCheckPhoto && photoCaptureRequestId),
    'Face check photo cannot be provided when using a photo capture request',
  )

  // find or create the identity
  let identity: IdentityEntity
  if (user.limitedAccessData?.identityId)
    identity = await entityManager.getRepository(IdentityEntity).findOneByOrFail({ id: user.limitedAccessData.identityId })
  else if (identityId) identity = await entityManager.getRepository(IdentityEntity).findOneByOrFail({ id: identityId })
  else if (!identityInput) throw new Error('Either identityId or identity must be provided')
  else identity = await createOrUpdateIdentity(entityManager, identityInput)

  // build claims data, starting with any claims defined on the contract with (default) values
  let claims: Record<string, any> = contract.display.claims.filter(({ value }) => !!value).map(({ claim, value }) => ({ [claim]: value }))
  // add issuance request claims input, overriding any contract-defined claim values
  if (claimsInput) Object.entries(claimsInput).forEach(([claim, value]) => (claims[claim] = value))
  // add face check photo claim, if supplied & allowed by the contract
  if (faceCheckPhoto && contract.faceCheckSupport !== FaceCheckPhotoSupport.None) claims['photo'] = convertFaceCheckPhoto(faceCheckPhoto)

  // validate the photo capture request matches to the contract and identity, set the claims data, and remove the capture cache
  if (photoCaptureRequestId) {
    const photoCaptureRequest = await getPhotoCaptureData(photoCaptureRequestId)
    invariant(photoCaptureRequest, 'Photo capture request not found')
    invariant(
      photoCaptureRequest.contractId.toUpperCase() === contractId.toUpperCase(),
      'Photo capture request must be for the same contract',
    )
    invariant(
      photoCaptureRequest.identityId.toUpperCase() === identity.id.toUpperCase(),
      'Photo capture request must be for the same identity',
    )
    invariant(photoCaptureRequest.photo, 'Photo capture request must have a photo captured')
    claims['photo'] = photoCaptureRequest.photo
  }

  // add standard claims
  const standardClaims: StandardClaimsData = {
    issuanceId: randomUUID(),
    name: identity.name,
  }
  claims = { ...claims, ...standardClaims }

  // create the issuance request
  const issuanceRequest: IssuanceRequest = {
    claims: claims,
    ...rest,
    type: contract.credentialTypes.join(','), // the Azure portal issuance example joins the types with a comma
    authority: (await verifiedIdAdmin.authority()).didModel.did,
    manifest: provisionedContract.manifestUrl,
    registration: issuanceRequestRegistration,
  }

  // send it
  const response = await request.createIssuanceRequest(issuanceRequest)

  // if the response is RequestErrorResponse, return it immediately
  if ('error' in response) return response

  // if this was a photo capture, remove the cache, as the photo data is designed to be used a single time
  if (photoCaptureRequestId) await deletePhotoCaptureRequest(photoCaptureRequestId)

  // cache issuance details for use in the callback
  const requestDetails: IssuanceRequestDetails = {
    id: standardClaims.issuanceId.toUpperCase(),
    issuedById: user.userEntity.id.toUpperCase(),
    identityId: identity.id.toUpperCase(),
    contractId: contract.id.toUpperCase(),
    expirationDate: issuanceRequest.expirationDate,
    photoCaptureRequestId,
    hasFaceCheckPhoto: contract.faceCheckSupport === FaceCheckPhotoSupport.None ? null : !!claims['photo'],
    asyncIssuanceKey,
  }
  await requestDetailsCache().set(response.requestId, JSON.stringify(requestDetails))

  return response
}

const invalidFaceCheckError = 'Face check photo must be a valid image/jpeg data URL with base64 encoding'

export function tryConvertFaceCheckPhoto(faceCheckPhoto: string):
  | {
      data: string
      success: true
      error?: undefined
    }
  | { data?: undefined; success: false; error: string } {
  try {
    return { data: convertFaceCheckPhoto(faceCheckPhoto), success: true }
  } catch {
    return { success: false, error: invalidFaceCheckError }
  }
}

// validates face check photo input and returns base64url encoded image data
export function convertFaceCheckPhoto(faceCheckPhoto: string) {
  const { encoding, data } = parseFaceCheckPhotoDataUrl(faceCheckPhoto)
  const buffer = Buffer.from(data, encoding)
  return buffer.toString('base64url')
}

// validates face check photo input
export function parseFaceCheckPhotoDataUrl(faceCheckPhoto: string) {
  try {
    return parseDataUrl(faceCheckPhoto, {
      validMimeTypes: ['image/jpeg'],
      validEncodings: ['base64'],
    })
  } catch {
    throw new Error(invalidFaceCheckError)
  }
}
