import { flatten, set } from 'lodash'
import { In } from 'typeorm'
import { faceCheckEnabled } from '../../../config'
import type { CommandContext } from '../../../cqs'
import { isFaceCheckPresentationEnabled, registerFeatureCheck } from '../../../cqs/feature-map'
import type { PresentationRequestInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { requestDetailsCache } from '../../callback/cache'
import { faceCheckPhotoClaimAttestation } from '../../contracts/claims'
import { createOrUpdateIdentity } from '../../identity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { PartnerEntity } from '../../partners/entities/partner-entity'
import type { PresentationEntity } from '../entities/presentation-entity'

export type PresentationRequestDetails = Pick<PresentationEntity, 'requestedById' | 'identityId' | 'requestedCredentials'> &
  PresentationContext
type PresentationContext = { limitedApprovalKey?: string; authnSessionKey?: string }

registerFeatureCheck(CreatePresentationRequestCommand, async (...[, input]) => isFaceCheckPresentationEnabled(input))

export async function CreatePresentationRequestCommand(
  this: CommandContext,
  { identityId, identity: identityInput, ...presentationRequest }: PresentationRequestInput,
  context?: PresentationContext,
) {
  const {
    user,
    entityManager,
    services: { verifiedIdRequest, verifiedIdAdmin },
  } = this

  userInvariant(user)

  invariant(presentationRequest.requestedCredentials.length > 0, 'Requested credentials must be provided')

  // validate identity info is provided IF requested credentials are from external issuers
  const platformIssuerDid = (await verifiedIdAdmin.authority()).didModel.did

  // assign requested credential acceptedIssuers, if not provided
  presentationRequest.requestedCredentials.forEach((requestedCredential) => {
    if (!requestedCredential.acceptedIssuers || requestedCredential.acceptedIssuers.length === 0)
      requestedCredential.acceptedIssuers = [platformIssuerDid]
  })

  const requestedIssuersAndTypes = flatten(
    presentationRequest.requestedCredentials.map((c) => c.acceptedIssuers!.map((i) => ({ issuer: i, type: c.type }))),
  )

  const doesIncludeExternalIssuer = requestedIssuersAndTypes.some(({ issuer }) => issuer && issuer !== platformIssuerDid)
  if (doesIncludeExternalIssuer) {
    const partners = await entityManager
      .getRepository(PartnerEntity)
      .findBy({ did: In([...new Set(requestedIssuersAndTypes.map((r) => r.issuer))]) })
    const doesIncludeUnknownIssuerOrType = requestedIssuersAndTypes.some(
      (requested) =>
        requested.issuer !== platformIssuerDid &&
        !partners.some((partner) => partner.did === requested.issuer && partner.credentialTypes.includes(requested.type)),
    )
    if (doesIncludeUnknownIssuerOrType)
      throw new Error('Requested credential type or issuer is not recognised as a credential type of a Partner.')
  }

  // find or create the identity, if provided
  const identity = identityId
    ? await entityManager.getRepository(IdentityEntity).findOneByOrFail({ id: identityId })
    : identityInput
      ? await createOrUpdateIdentity(entityManager, identityInput)
      : undefined

  // if an identity is provided, add a constraint for identityId to each requested credential
  if (identityId) {
    presentationRequest.requestedCredentials.forEach((requestedCredential) => {
      const existingIdentityConstraint = requestedCredential.constraints?.find((constraint) => constraint.claimName === 'identityId')
      invariant(
        !existingIdentityConstraint,
        `An 'identityId' constraint cannot be accepted in addition to presentation identity input. An 'identityId' constraint will automatically be applied.`,
      )

      if (!requestedCredential.constraints) requestedCredential.constraints = []
      requestedCredential.constraints.push({ claimName: 'identityId', values: [identityId] })
    })
  }

  // set the sourcePhotoClaimName field on any requested credential where faceCheck is specified
  presentationRequest.requestedCredentials.forEach(({ configuration }) => {
    if (configuration?.validation?.faceCheck) {
      invariant(faceCheckEnabled, 'Face check is not enabled on this instance')
      // use `set` to change the schema input type FaceCheckValidationInput into the VID service type `{sourcePhotoClaimName: string}`
      set(configuration.validation.faceCheck, 'sourcePhotoClaimName', faceCheckPhotoClaimAttestation.outputClaim)
    }
  })

  // send it
  const response = await verifiedIdRequest.createPresentationRequest({
    ...presentationRequest,
    authority: platformIssuerDid,
  })

  // if the response is RequestErrorResponse, return it immediately
  if ('error' in response) return response

  // cache presentation details for use in the callback
  const requestDetails: PresentationRequestDetails = {
    requestedById: user.entity.id,
    identityId: identity?.id ?? null,
    requestedCredentials: presentationRequest.requestedCredentials,
    ...context,
  }
  await requestDetailsCache().set(response.requestId, JSON.stringify(requestDetails))

  return response
}
