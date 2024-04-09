import { randomUUID } from 'crypto'
import { REQUEST_CACHE_TTL, requestDetailsCache } from '../../../cache'
import { issuanceRequestRegistration } from '../../../config'
import type { CommandContext } from '../../../cqs'
import { FaceCheckPhotoSupport, type IssuanceRequestInput } from '../../../generated/graphql'
import type { IssuanceRequest } from '../../../services/verified-id'
import { isValidImageDataUrl, toBase64UrlWithoutMimeType } from '../../../util/data-url'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import type { StandardClaims } from '../../contracts/claims'
import { validateIssuanceClaims } from '../../contracts/claims'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { createOrUpdateIdentity } from '../../identity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import type { IssuanceEntity } from '../entities/issuance-entity'

export type IssuanceRequestDetails = Pick<IssuanceEntity, 'id' | 'issuedById' | 'identityId' | 'contractId'> &
  Pick<IssuanceRequestInput, 'expirationDate'>

type StandardClaimsData = Record<StandardClaims, string>

export async function CreateIssuanceRequestCommand(
  this: CommandContext,
  { contractId, identityId, identity: identityInput, claims: claimsInput, faceCheckPhoto, ...rest }: IssuanceRequestInput,
) {
  const {
    user,
    entityManager,
    services: { verifiedIdRequest: request, verifiedIdAdmin },
  } = this

  userInvariant(user)

  validateIssuanceClaims(claimsInput)

  // find the contract
  const contract = await entityManager.getRepository(ContractEntity).findOneByOrFail({ id: contractId })
  invariant(contract.externalId, 'Contract must be provisioned before issuance')
  invariant(!contract.isDeprecated, 'Contract must not be deprecated')

  // find the provisioned contract
  const provisionedContract = await verifiedIdAdmin.contract(contract.externalId)
  invariant(provisionedContract, 'Published contract could not be found')

  // validate the face check photo input
  if (contract.faceCheckSupport === FaceCheckPhotoSupport.Required)
    invariant(faceCheckPhoto, 'Face check photo is required for issuance of this contract')

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
  if (faceCheckPhoto && contract.faceCheckSupport !== FaceCheckPhotoSupport.None) {
    const isValid = await isValidImageDataUrl(faceCheckPhoto)
    if (!isValid) throw new Error('Invalid face check photo')
    claims['photo'] = toBase64UrlWithoutMimeType(faceCheckPhoto)
  }
  // add standard claims
  const standardClaims: StandardClaimsData = {
    issuanceId: randomUUID(),
    name: identity.name,
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

  // cache issuance details for use in the callback
  const requestDetails: IssuanceRequestDetails = {
    id: standardClaims.issuanceId.toUpperCase(),
    issuedById: user.userEntity.id.toUpperCase(),
    identityId: identity.id.toUpperCase(),
    contractId: contract.id.toUpperCase(),
    expirationDate: issuanceRequest.expirationDate,
  }
  await requestDetailsCache.set(response.requestId, JSON.stringify(requestDetails), {
    ttl: REQUEST_CACHE_TTL,
  })

  return response
}
