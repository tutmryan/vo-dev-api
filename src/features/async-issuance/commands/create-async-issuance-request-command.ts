import { randomUUID } from 'crypto'
import { isValidPhoneNumber } from 'libphonenumber-js'
import { omit } from 'lodash'
import { calculateExpiryFromNow, convertAsyncIssuanceRequestExpiryToDays } from '..'
import { addToJobQueue } from '../../../background-jobs/queue'
import type { CommandContext } from '../../../cqs'
import { isFaceCheckPhotoEnabled, registerFeatureCheck } from '../../../cqs/feature-map'
import type {
  AsyncIssuanceContactInput,
  AsyncIssuanceErrorResponse,
  AsyncIssuanceRequestInput,
  AsyncIssuanceResponse,
  IdentityInput,
  Maybe,
} from '../../../generated/graphql'
import { ContactMethod, FaceCheckPhotoSupport } from '../../../generated/graphql'
import { logger } from '../../../logger'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { isValidEmail } from '../../../util/validation'
import { validateIssuanceClaims, validateIssuanceClaimsAgainstContractClaims } from '../../contracts/claims'
import { createOrUpdateIdentity } from '../../identity'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'

registerFeatureCheck(CreateAsyncIssuanceRequestCommand, async (...[, input]) => isFaceCheckPhotoEnabled(input))

const identityInputKey = ({ issuer, identifier }: IdentityInput) => issuer + identifier

const loggableAsyncIssuanceInput = (input: AsyncIssuanceRequestInput) => omit(input, ['contact'])

const invalidPhoneNumberMessage = (contactType: 'notification' | 'verification') =>
  `Phone number for contact ${contactType} must use international E.164 format`

const invalidEmailMessage = (contactType: 'notification' | 'verification') => `Email address for contact ${contactType} is invalid`

function validateContact({ notification, verification }: AsyncIssuanceContactInput) {
  if (notification.method === ContactMethod.Email) {
    if (!isValidEmail(notification.value)) throw new Error(invalidEmailMessage('notification'))
  } else {
    if (!isValidPhoneNumber(notification.value)) throw new Error(invalidPhoneNumberMessage('notification'))
  }

  if (!verification) return

  if (verification.method === ContactMethod.Email) {
    if (!isValidEmail(verification.value)) throw new Error(invalidEmailMessage('verification'))
  } else {
    if (!isValidPhoneNumber(verification.value)) throw new Error(invalidPhoneNumberMessage('verification'))
  }
}

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
      const {
        contractId,
        identityId,
        identity,
        claims,
        faceCheckPhoto: faceCheckPhotoInput,
        photoCapture,
        contact,
        expiry,
        expirationDate,
      } = asyncIssuanceInput

      // validate contact
      validateContact(contact)

      // validate issuance claims (excluding contract claims)
      validateIssuanceClaims(claims)

      // locate and validate the contract
      const contract = await contracts.load(contractId)
      invariant(contract, 'Contract could not be found')
      invariant(contract.externalId, 'Contract must be provisioned before issuance')
      invariant(!contract.isDeprecated, 'Contract must not be deprecated')

      // validate that the provided claims include the required contract claims
      validateIssuanceClaimsAgainstContractClaims(claims, contract.display.claims)

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

      if (expirationDate) {
        invariant(calculateExpiryFromNow(expiry) < expirationDate, 'Credential expiry must fall after the period to claim it')
      }
    } catch (error) {
      logger.error(`Validation of async issuance request ${index + 1} of ${requestInput.length} failed`, {
        error,
        asyncIssuanceInput: loggableAsyncIssuanceInput(asyncIssuanceInput),
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
      logger.error(`Saving async issuance request ${index + 1} of ${requestInput.length} failed`, {
        error,
        asyncIssuanceInput: loggableAsyncIssuanceInput(asyncIssuanceInput),
      })
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
