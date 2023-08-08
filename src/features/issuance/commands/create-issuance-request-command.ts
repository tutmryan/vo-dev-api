import { randomUUID } from 'crypto'
import { REQUEST_CACHE_TTL, requestDetailsCache } from '../../../cache'
import config from '../../../config'
import type { CommandContext } from '../../../cqrs/command-context'
import type { IssuanceRequestInput } from '../../../generated/graphql'
import type { IssuanceRequest } from '../../../services/request'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import type { StandardClaims } from '../../contracts/claims'
import { validateIssuanceClaims } from '../../contracts/claims'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { createOrUpdateIdentity } from '../../identity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import type { IssuanceEntity } from '../entities/issuance-entity'

export type IssuanceRequestDetails = Pick<IssuanceEntity, 'id' | 'userId' | 'identityId' | 'contractId'>

type StandardClaimsData = Record<StandardClaims, string>

export async function CreateIssuanceRequestCommand(
  this: CommandContext,
  { contractId, identityId, identity: identityInput, claims: claimsInput, ...rest }: IssuanceRequestInput,
) {
  const {
    user,
    entityManager,
    services: { request, admin },
  } = this

  userInvariant(user)

  validateIssuanceClaims(claimsInput)

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

  // build claims data, starting with any claims defined on the contract with (default) values
  let claims: Record<string, any> = contract.display.claims.filter(({ value }) => !!value).map(({ claim, value }) => ({ [claim]: value }))
  // add issuance request claims input, overriding any contract-defined claim values
  if (claimsInput) Object.entries(claimsInput).forEach(([claim, value]) => (claims[claim] = value))
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
    authority: (await admin.authority()).didModel.did,
    manifest: provisionedContract.manifestUrl,
    registration: config.get('issuanceRequestRegistration'),
  }

  // send it
  const response = await request.createIssuanceRequest(issuanceRequest)

  // cache issuance details for use in the callback
  const requestDetails: IssuanceRequestDetails = {
    id: standardClaims.issuanceId.toUpperCase(),
    userId: user.userEntity.id.toUpperCase(),
    identityId: identity.id.toUpperCase(),
    contractId: contract.id.toUpperCase(),
  }
  await requestDetailsCache.set(response.requestId, JSON.stringify(requestDetails), {
    ttl: REQUEST_CACHE_TTL,
  })

  return response
}
