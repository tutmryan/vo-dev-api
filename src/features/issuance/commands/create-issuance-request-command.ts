import { randomUUID } from 'crypto'
import { issuanceRequestRegistration } from '../../../config'
import type { CommandContext } from '../../../cqs'
import { isFaceCheckPhotoEnabled, registerFeatureCheck } from '../../../cqs/feature-map'
import { ClaimType, FaceCheckPhotoSupport, type IssuanceRequestInput } from '../../../generated/graphql'
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

  // validate that the provided claims include the required contract claims and validate all claim values
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

  // Build the claims data, starting with any claims defined on the contract with (default) values
  const claimsData: Record<string, any> = {}

  // Populate relevant claims fields from the contract
  contract.display.claims.forEach(({ claim, type, value, isFixed }) => {
    claimsData[claim] = { type, value, isFixed: !!isFixed }
  })

  // Assign issuance request claims input to value, overriding any contract-defined claim values unless isFixed
  if (claimsInput) {
    Object.entries(claimsInput).forEach(([claim, inputValue]) => {
      claimsData[claim] = {
        ...claimsData[claim],
        value: claimsData[claim]?.isFixed ? claimsData[claim].value : inputValue,
      }
    })
  }

  // Flatten and process photo claims
  let claims: Record<string, any> = Object.fromEntries(
    Object.entries(claimsData).map(([claim, { type, value }]) => [
      claim,
      type === ClaimType.Image && value ? convertImageClaimInput(value, claim) : value,
    ]),
  )

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
    identityId: identity.id,
  }
  claims = { ...claims, ...standardClaims }

  // create the issuance request
  const issuanceRequest: IssuanceRequest = {
    claims,
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
const invalidImageClaimError = (claim: string) => `Image claim '${claim}' must be a valid image/jpeg data URL with base64 encoding`

// validates image claim input and returns the base64url encoded image data (to be used as the claim value)
function convertImageClaimInputToClaimValue(imageDataUrl: string, errorMessage: string) {
  const { encoding, data } = parseImageClaimDataUrl(imageDataUrl, errorMessage)
  const buffer = Buffer.from(data, encoding)
  return buffer.toString('base64url')
}

// parses and validates image claim input (jpeg data URL with base64 encoding)
function parseImageClaimDataUrl(imageDataUrl: string, errorMessage: string) {
  try {
    return parseDataUrl(imageDataUrl, {
      validMimeTypes: ['image/jpeg'],
      validEncodings: ['base64'],
    })
  } catch {
    throw new Error(errorMessage)
  }
}

// validates face check photo input and returns base64url encoded image data
export const convertFaceCheckPhoto = (photo: string) => convertImageClaimInputToClaimValue(photo, invalidFaceCheckError)

// validates image claim input and returns the base64url encoded image data (to be used as the claim value)
export const convertImageClaimInput = (image: string, claim: string) =>
  convertImageClaimInputToClaimValue(image, invalidImageClaimError(claim))

// parses and validates face check photo input (jpeg data URL with base64 encoding)
export const validateFaceCheckPhoto = (photo: string) => parseImageClaimDataUrl(photo, invalidFaceCheckError)

// parses and validates image claim input (jpeg data URL with base64 encoding)
export const validateImageClaimInput = (image: string, claim: string) => parseImageClaimDataUrl(image, invalidImageClaimError(claim))
