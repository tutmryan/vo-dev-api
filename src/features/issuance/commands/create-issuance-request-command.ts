import type { IssuanceRequestDetails } from '../../../cache'
import { REQUEST_CACHE_TTL, requestDetailsCache } from '../../../cache'
import config from '../../../config'
import type { CommandContext } from '../../../cqrs/command-context'
import type { IssuanceRequestInput } from '../../../generated/graphql'
import type { IssuanceRequest } from '../../../services/request'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { createOrUpdateIdentity } from '../../identity'
import { IdentityEntity } from '../../identity/entities/identity-entity'

export async function CreateIssuanceRequestCommand(
  this: CommandContext,
  { contractId, identityId, identity: identityInput, ...rest }: IssuanceRequestInput,
) {
  const {
    user,
    entityManager,
    services: { request, admin },
  } = this

  userInvariant(user)

  // find the contract
  const contract = await entityManager.getRepository(ContractEntity).findOneByOrFail({ id: contractId })
  invariant(contract.externalId, 'Contract must be provisioned before issuance')

  // find the provisioned contract
  const provisionedContract = await admin.contract(contract.externalId)
  invariant(provisionedContract, 'Published contract could not be found')

  // find or create the identity
  let identity: IdentityEntity
  if (identityId) identity = await entityManager.getRepository(IdentityEntity).findOneByOrFail({ id: identityId })
  else if (!identityInput) throw new Error('Either identityId or identity must be provided')
  else identity = await createOrUpdateIdentity(entityManager, identityInput)

  // create the issuance request
  const issuanceRequest: IssuanceRequest = {
    ...rest,
    authority: (await admin.authority()).didModel.did,
    manifest: provisionedContract.manifestUrl,
    registration: config.get('issuanceRequestRegistration'),
  }

  // send it
  const response = await request.createIssuanceRequest(issuanceRequest)

  // cache issuance details for use in the callback
  const requestDetails: IssuanceRequestDetails = {
    userId: user.userEntity.id.toUpperCase(),
    identityId: identity.id.toUpperCase(),
    contractId: contract.id.toUpperCase(),
  }
  await requestDetailsCache.set(response.requestId, JSON.stringify(requestDetails), {
    ttl: REQUEST_CACHE_TTL,
  })

  return response
}
