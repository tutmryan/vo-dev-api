import { randomUUID } from 'crypto'
import { convertAsyncIssuanceRequestExpiryToDays } from '..'
import { addToJobQueue } from '../../../background-jobs/queue'
import type { CommandContext } from '../../../cqs'
import { isFaceCheckPhotoEnabled, registerFeatureCheck } from '../../../cqs/feature-map'
import type {
  AsyncIssuanceErrorResponse,
  AsyncIssuanceRequestInput,
  AsyncIssuanceResponse,
  IdentityInput,
  Maybe,
} from '../../../generated/graphql'
import { FaceCheckPhotoSupport } from '../../../generated/graphql'
import { logger } from '../../../logger'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { validateIssuanceClaims } from '../../contracts/claims'
import { createOrUpdateIdentity } from '../../identity'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'

registerFeatureCheck(CreateAsyncIssuanceRequestCommand, async (...[, input]) => isFaceCheckPhotoEnabled(input))

const identityInputKey = ({ issuer, identifier }: IdentityInput) => issuer + identifier

export async function CreateAsyncIssuanceRequestCommand(
  this: CommandContext,
  requestInput: AsyncIssuanceRequestInput[],
): Promise<AsyncIssuanceResponse | AsyncIssuanceErrorResponse> {
  const {
    user,
    entityManager,
    dataLoaders: { contracts, identities },
    services: { asyncIssuances },
  } = this

  userInvariant(user)

  const errorResponse: AsyncIssuanceErrorResponse = {
    errors: [],
  }

  const identitiesToCreate: IdentityInput[] = []

  // Validate the input
  for (const [index, asyncIssuanceInput] of requestInput.entries()) {
    try {
      const { contractId, identityId, identity, claims, faceCheckPhoto: faceCheckPhotoInput, photoCapture } = asyncIssuanceInput

      validateIssuanceClaims(claims)

      // find the contract
      const contract = await contracts.load(contractId)
      invariant(contract, 'Contract could not be found')
      invariant(contract.externalId, 'Contract must be provisioned before issuance')
      invariant(!contract.isDeprecated, 'Contract must not be deprecated')

      // find the identity if specified by ID
      if (identityId) {
        const existingIdentity = await identities.load(identityId)
        invariant(existingIdentity, 'Identity could not be found')
      }

      // build the list of identities to create
      if (identity) identitiesToCreate.push(identity)

      // validate the face check/photo capture input
      if (contract.faceCheckSupport === FaceCheckPhotoSupport.Required) {
        invariant(
          faceCheckPhotoInput || photoCapture,
          'Face check photo or using a photo capture request is required for issuance of this contract',
        )
      }

      if (contract.faceCheckSupport === FaceCheckPhotoSupport.None) {
        invariant(
          !faceCheckPhotoInput && !photoCapture,
          'Contract must support face check when providing either a face check photo or using a photo capture request',
        )
      }

      // validate that there is either no image data (false, false) or the image data is from a single source (false, true) | (true, false)
      invariant(
        (!faceCheckPhotoInput && !photoCapture) || (faceCheckPhotoInput && !photoCapture) || (!faceCheckPhotoInput && photoCapture),
        'Face check photo cannot be provided when using a photo capture request',
      )
    } catch (error) {
      logger.error(`Validation of async issuance request ${index + 1} of ${requestInput.length} failed`, {
        asyncIssuanceInput,
      })
      errorResponse.errors[index] = error instanceof Error ? error.message : 'An unknown error occurred'
    }
  }

  if (errorResponse.errors.length > 0) {
    return errorResponse
  }

  // create identities, deduplicating (for performance) via identity key
  const createdIdentityIds = new Map<string, string>()

  for (const identityInput of identitiesToCreate) {
    const key = identityInputKey(identityInput)
    if (createdIdentityIds.has(key)) continue

    const { id } = await createOrUpdateIdentity(entityManager, identityInput)
    createdIdentityIds.set(key, id)
  }

  // function to return the provided ID or created identity ID
  const getIdentityId = ({ identityId, identity }: { identityId?: Maybe<string>; identity?: Maybe<IdentityInput> }) => {
    if (identityId) return identityId

    invariant(identity, 'Neither identity ID nor identity input provided')
    const id = createdIdentityIds.get(identityInputKey(identity))

    invariant(id, 'Identity was not created')
    return id
  }

  const response: AsyncIssuanceResponse = {
    asyncIssuanceRequestIds: [],
  }

  // Save the requests
  for (const [index, asyncIssuanceInput] of requestInput.entries()) {
    const { contractId, identityId, identity, expiry } = asyncIssuanceInput

    try {
      const issuanceRequest = await entityManager.getRepository(AsyncIssuanceEntity).save(
        new AsyncIssuanceEntity({
          id: randomUUID(),
          contractId,
          identityId: getIdentityId({ identityId, identity }),
          expiryPeriodInDays: convertAsyncIssuanceRequestExpiryToDays(expiry),
        }),
      )
      await asyncIssuances.uploadAsyncIssuance(issuanceRequest.id, asyncIssuanceInput)
      response.asyncIssuanceRequestIds.push(issuanceRequest.id)
    } catch (error) {
      logger.error(`Saving async issuance request ${index + 1} of ${requestInput.length} failed`, { asyncIssuanceInput })
      throw error
    }
  }

  // Note: We're using the requests IDs to avoid the job queue from referencing PII data directly via the payload data
  await addToJobQueue({
    name: 'sendAsyncIssuanceNotifications',
    payload: { userId: user.userEntity.id, asyncIssuanceRequestIds: response.asyncIssuanceRequestIds },
  })

  logger.info(`Validated and saved ${response.asyncIssuanceRequestIds.length} async issuance requests`)
  return response
}
