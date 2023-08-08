import { REQUEST_CACHE_TTL, requestDetailsCache } from '../../../cache'
import type { CommandContext } from '../../../cqrs/command-context'
import type { PresentationRequestInput } from '../../../generated/graphql'
import { userInvariant } from '../../../util/user-invariant'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { createOrUpdateIdentity } from '../../identity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import type { PresentationEntity } from '../entities/presentation-entity'

export type PresentationRequestDetails = Pick<PresentationEntity, 'userId' | 'identityId' | 'requestedCredentials'>

export async function CreatePresentationRequestCommand(
  this: CommandContext,
  { identityId, identity: identityInput, requestedContracts, ...presentationRequest }: PresentationRequestInput,
) {
  const {
    user,
    entityManager,
    services: { request, admin },
  } = this

  userInvariant(user)

  // find or create the identity
  let identity: IdentityEntity
  if (identityId) identity = await entityManager.getRepository(IdentityEntity).findOneByOrFail({ id: identityId })
  else if (!identityInput) throw new Error('Either identityId or identity must be provided')
  else identity = await createOrUpdateIdentity(entityManager, identityInput)

  const issuerDid = (await admin.authority()).didModel.did

  // assign requested credential issuers if not provided
  if (presentationRequest.requestedCredentials)
    presentationRequest.requestedCredentials.forEach((requestedCredential) => {
      if (!requestedCredential.acceptedIssuers || requestedCredential.acceptedIssuers.length === 0)
        requestedCredential.acceptedIssuers = [issuerDid]
    })

  // turn requestedContracts into extra requestedCredentials
  if (requestedContracts) {
    const requestedCredentials = presentationRequest.requestedCredentials ?? []
    const contractRepo = entityManager.getRepository(ContractEntity)
    for (const { contractId, ...rest } of requestedContracts) {
      const contract = await contractRepo.findOneByOrFail({ id: contractId })
      contract.credentialTypes.forEach((credentialType) => {
        requestedCredentials.push({
          ...rest,
          type: credentialType,
          acceptedIssuers: [issuerDid],
        })
      })
    }
    presentationRequest.requestedCredentials = requestedCredentials
  }

  // send it
  const response = await request.createPresentationRequest({ ...presentationRequest, authority: issuerDid })

  // cache presentation details for use in the callback
  const requestDetails: PresentationRequestDetails = {
    userId: user.userEntity.id.toUpperCase(),
    identityId: identity.id.toUpperCase(),
    requestedCredentials: presentationRequest.requestedCredentials ?? [],
  }
  await requestDetailsCache.set(response.requestId, JSON.stringify(requestDetails), {
    ttl: REQUEST_CACHE_TTL,
  })

  return response
}
