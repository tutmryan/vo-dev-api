import { isNotFalsy } from '@makerx/node-common'
import { randomUUID } from 'crypto'
import { isValidPhoneNumber } from 'libphonenumber-js'
import { omit } from 'lodash'
import { calculateExpiryFromNow, convertAsyncIssuanceRequestExpiryToDays } from '..'
import { addToJobQueue } from '../../../background-jobs'
import type { CommandContext } from '../../../cqs'
import { isFaceCheckPhotoEnabled, registerFeatureCheck } from '../../../cqs/feature-map'
import { dataSource } from '../../../data'
import { bulkFindBy, bulkInsert } from '../../../data/bulk-operations'
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
import { validateIssuanceRequestBodySize } from '../../../services/verified-id/utils'
import { invariant } from '../../../util/invariant'
import { throwError } from '../../../util/throw-error'
import { userInvariant } from '../../../util/user-invariant'
import { isValidEmail } from '../../../util/validation'
import { validateIssuanceClaimsAgainstContractClaims } from '../../contracts/claims'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { bulkCreateOrUpdateIdentity, identityInputKey } from '../../identity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { validateFaceCheckPhoto } from '../../issuance/commands/create-issuance-request-command'
import { AsyncIssuanceAudit } from '../entities/async-issuance-audit'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'

registerFeatureCheck(CreateAsyncIssuanceRequestCommand, async (...[, input]) => isFaceCheckPhotoEnabled(input))

const loggableAsyncIssuanceInput = (input: AsyncIssuanceRequestInput) => omit(input, ['contact'])

const invalidPhoneNumberMessage = (contactType: 'notification' | 'verification') =>
  `Phone number for contact ${contactType} must use international E.164 format`

const invalidEmailMessage = (contactType: 'notification' | 'verification') => `Email address for contact ${contactType} is invalid`

function validateContact(contact?: Maybe<AsyncIssuanceContactInput>) {
  if (!contact) return

  const { notification, verification } = contact

  if (notification) {
    if (notification.method === ContactMethod.Email) {
      if (!isValidEmail(notification.value)) throw new Error(invalidEmailMessage('notification'))
    } else if (!isValidPhoneNumber(notification.value)) throw new Error(invalidPhoneNumberMessage('notification'))
  }

  if (verification) {
    if (verification.method === ContactMethod.Email) {
      if (!isValidEmail(verification.value)) throw new Error(invalidEmailMessage('verification'))
    } else if (!isValidPhoneNumber(verification.value)) throw new Error(invalidPhoneNumberMessage('verification'))
  }
}

export async function CreateAsyncIssuanceRequestCommand(
  this: CommandContext,
  requestInput: AsyncIssuanceRequestInput[],
): Promise<AsyncIssuanceResponse | AsyncIssuanceErrorResponse> {
  const {
    user,
    entityManager,
    services: { asyncIssuances },
  } = this

  userInvariant(user)

  invariant(requestInput.length <= 1000, 'Cannot create more than 1000 async issuance requests at once')

  const errorResponse: AsyncIssuanceErrorResponse = {
    errors: [],
  }

  const identitiesToCreateOrUpdate: IdentityInput[] = []

  const referencedContracts = new Map(
    (
      await bulkFindBy(
        dataSource.getRepository(ContractEntity),
        'id',
        [...new Set(requestInput.map((i) => i.contractId))],
        'FindIdentitiesById',
      )
    ).map((contract) => [contract.id, contract]),
  )

  const referencedIdentities = new Map(
    (
      await bulkFindBy(
        dataSource.getRepository(IdentityEntity),
        'id',
        [...new Set(requestInput.map((i) => i.identityId ?? null).filter(isNotFalsy))],
        'FindIdentitiesById',
      )
    ).map((identity) => [identity.id, identity]),
  )

  // Validate the input
  for (const [index, asyncIssuanceInput] of requestInput.entries()) {
    try {
      const {
        contractId,
        identityId,
        identity,
        claims: claimsInput,
        faceCheckPhoto: faceCheckPhotoInput,
        photoCapture,
        contact,
        expiry,
        expirationDate,
      } = asyncIssuanceInput

      // validate the size of the request
      validateIssuanceRequestBodySize(asyncIssuanceInput)

      // validate contact
      validateContact(contact)

      // locate and validate the contract
      const contract = referencedContracts.get(contractId.toLowerCase())
      invariant(contract, 'Contract could not be found')
      invariant(contract.externalId, 'Contract must be provisioned before issuance')
      invariant(!contract.isDeprecated, 'Contract must not be deprecated')

      // validate that the provided claims include the required contract claims and validate all claim values
      validateIssuanceClaimsAgainstContractClaims(claimsInput, contract.display.claims)

      // find the identity if specified by ID
      if (identityId) {
        invariant(referencedIdentities.has(identityId.toLowerCase()), 'Identity could not be found')
      }

      // build the list of identities to create
      if (identity) identitiesToCreateOrUpdate.push(identity)

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

      // validate face check photo, if provided
      if (faceCheckPhotoInput) {
        validateFaceCheckPhoto(faceCheckPhotoInput)
      }

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

  const identityMap = await bulkCreateOrUpdateIdentity(entityManager, identitiesToCreateOrUpdate)

  const response: AsyncIssuanceResponse = {
    asyncIssuanceRequestIds: [],
  }

  // Save the requests
  const asyncIssuancesToSave = requestInput.map((asyncIssuanceInput) => {
    const { contractId, identityId, identity, expiry } = asyncIssuanceInput

    invariant(identity || identityId, 'Identity or identity ID must be provided')

    const asyncIssuance = new AsyncIssuanceEntity({
      id: randomUUID(),
      contractId,
      identityId: identityId ? identityId : identityMap.get(identityInputKey(identity!)) ?? throwError('Identity not found'),
      expiryPeriodInDays: convertAsyncIssuanceRequestExpiryToDays(expiry),
      postIssuanceRedirectUrl: asyncIssuanceInput.postIssuanceRedirectUrl ?? null,
    })
    response.asyncIssuanceRequestIds.push(asyncIssuance.id)
    return { asyncIssuance, asyncIssuanceInput }
  })

  await bulkInsert(
    asyncIssuancesToSave.map(({ asyncIssuance }) => asyncIssuance),
    AsyncIssuanceEntity,
    entityManager,
    {
      entityAuditTarget: AsyncIssuanceAudit,
    },
  )

  // Save PII data for the async issuance requests to a secure location
  // Upload in batches of ## to avoid flooding the network interface
  const batchSize = 40
  for (let i = 0; i < asyncIssuancesToSave.length; i += batchSize) {
    await Promise.all(
      asyncIssuancesToSave
        .slice(i, i + batchSize)
        .map(async ({ asyncIssuance, asyncIssuanceInput }) => asyncIssuances.uploadAsyncIssuance(asyncIssuance.id, asyncIssuanceInput)),
    )
  }

  // Note: We're using the requests IDs to avoid the job queue from referencing PII data directly via the payload data
  await addToJobQueue('sendAsyncIssuanceNotifications', {
    userId: user.entity.id,
    asyncIssuanceRequestIds: response.asyncIssuanceRequestIds,
  })

  logger.info(`Validated and saved ${response.asyncIssuanceRequestIds.length} async issuance requests`)
  return response
}
