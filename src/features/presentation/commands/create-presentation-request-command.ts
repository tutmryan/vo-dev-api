import { flatten } from 'lodash'
import { In } from 'typeorm'
import { REQUEST_CACHE_TTL, requestDetailsCache } from '../../../cache'
import type { CommandContext } from '../../../cqs'
import type { PresentationRequestInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { createOrUpdateIdentity } from '../../identity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { PartnerEntity } from '../../network/entities/partner-entity'
import type { PresentationEntity } from '../entities/presentation-entity'

export type PresentationRequestDetails = Pick<PresentationEntity, 'requestedById' | 'identityId' | 'requestedCredentials'>

export async function CreatePresentationRequestCommand(
  this: CommandContext,
  { identityId, identity: identityInput, ...presentationRequest }: PresentationRequestInput,
) {
  const {
    user,
    entityManager,
    services: { request, admin },
  } = this

  userInvariant(user)

  invariant(presentationRequest.requestedCredentials.length > 0, 'Requested credentials must be provided')

  // validate identity info is provided IF requested credentials are from external issuers
  const platformIssuerDid = (await admin.authority()).didModel.did

  // assign requested credential acceptedIssuers, if not provided
  presentationRequest.requestedCredentials.forEach((requestedCredential) => {
    if (!requestedCredential.acceptedIssuers || requestedCredential.acceptedIssuers.length === 0)
      requestedCredential.acceptedIssuers = [platformIssuerDid]
  })

  const requestedIssuersAndTypes = flatten(
    presentationRequest.requestedCredentials.map((c) => c.acceptedIssuers!.map((i) => ({ issuer: i, type: c.type }))),
  )

  const hasInternallyIssuedTypes = requestedIssuersAndTypes.some(({ issuer }) => issuer === platformIssuerDid)
  if (!hasInternallyIssuedTypes && !identityId && !identityInput)
    throw new Error(
      'Either identityId or identity info must be provided for presentations where all requested credentials are issued by external partners.',
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

  // send it
  const response = await request.createPresentationRequest({ ...presentationRequest, authority: platformIssuerDid })

  // cache presentation details for use in the callback
  const requestDetails: PresentationRequestDetails = {
    requestedById: user.userEntity.id.toUpperCase(),
    identityId: identity?.id.toUpperCase() ?? null,
    requestedCredentials: presentationRequest.requestedCredentials,
  }
  await requestDetailsCache.set(response.requestId, JSON.stringify(requestDetails), {
    ttl: REQUEST_CACHE_TTL,
  })

  return response
}
