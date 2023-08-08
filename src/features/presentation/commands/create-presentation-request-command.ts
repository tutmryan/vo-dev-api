import { REQUEST_CACHE_TTL, requestDetailsCache } from '../../../cache'
import type { CommandContext } from '../../../cqrs/command-context'
import type { PresentationRequestInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { createOrUpdateIdentity } from '../../identity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import type { PresentationEntity } from '../entities/presentation-entity'

export type PresentationRequestDetails = Pick<PresentationEntity, 'userId' | 'identityId' | 'requestedCredentials'>

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
  const issuerDid = (await admin.authority()).didModel.did
  const isExternalIssuer = presentationRequest.requestedCredentials.some(
    ({ acceptedIssuers }) => acceptedIssuers && acceptedIssuers.some((acceptedIssuer) => acceptedIssuer !== issuerDid),
  )
  if (isExternalIssuer && !identityId && !identityInput)
    throw new Error('Either identityId or identity info must be provided for presentations from external issuers')

  // find or create the identity, if provided
  const identity = identityId
    ? await entityManager.getRepository(IdentityEntity).findOneByOrFail({ id: identityId })
    : identityInput
    ? await createOrUpdateIdentity(entityManager, identityInput)
    : undefined

  // assign requested credential acceptedIssuers, if not provided
  presentationRequest.requestedCredentials.forEach((requestedCredential) => {
    if (!requestedCredential.acceptedIssuers || requestedCredential.acceptedIssuers.length === 0)
      requestedCredential.acceptedIssuers = [issuerDid]
  })

  // send it
  const response = await request.createPresentationRequest({ ...presentationRequest, authority: issuerDid })

  // cache presentation details for use in the callback
  const requestDetails: PresentationRequestDetails = {
    userId: user.userEntity.id.toUpperCase(),
    identityId: identity?.id.toUpperCase() ?? null,
    requestedCredentials: presentationRequest.requestedCredentials,
  }
  await requestDetailsCache.set(response.requestId, JSON.stringify(requestDetails), {
    ttl: REQUEST_CACHE_TTL,
  })

  return response
}
