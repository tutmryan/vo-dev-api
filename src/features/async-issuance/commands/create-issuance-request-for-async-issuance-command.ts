import { AuditEvents } from '../../../audit-types'
import { type TransactionalCommandContext } from '../../../cqs'
import { type IssuanceRequestResponse } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userIsIdentityEntity } from '../../../util/user-invariant'
import { getAsyncIssuanceSessionKey, setAsyncIssuanceSessionData } from '../../async-issuance/session'
import { requestDetailsCache } from '../../callback/cache'
import type { IssuanceRequestDetails } from '../../issuance/commands/create-issuance-request-command'
import { executeIssuanceRequest } from '../../issuance/commands/execute-issuance-request'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'

export async function CreateIssuanceRequestForAsyncIssuanceCommand(
  this: TransactionalCommandContext,
  asyncIssuanceRequestId: string,
  photo?: string,
): Promise<IssuanceRequestResponse> {
  const { services, user, inTransaction, logger } = this

  logger.mergeMeta({
    asyncIssuanceRequestId,
  })

  // this command can be run in two scenarios:
  // 1. user has established a limited async issuance session via OTP verification
  // 2. user is an authenticated identity

  invariant(user, 'User is not authenticated')

  const limitedAsyncIssuanceData = user.limitedAsyncIssuanceData
  const userIsIdentity = userIsIdentityEntity(user)
  invariant(limitedAsyncIssuanceData || userIsIdentity, 'User is not authorised')

  // validate limited session is for the requested async issuance
  if (user.limitedAsyncIssuanceData)
    invariant(
      user.limitedAsyncIssuanceData.asyncIssuanceRequestId === asyncIssuanceRequestId,
      'Invalid async issuance request id for session',
    )

  const asyncIssuanceEntity = await inTransaction(async (entityManager) => {
    return await entityManager.getRepository(AsyncIssuanceEntity).findOneByOrFail({ id: asyncIssuanceRequestId })
  })

  // validate authenticated identity is the intended recipient
  if (userIsIdentity) invariant(asyncIssuanceEntity.identityId === user.entity.id, 'Invalid async issuance request id for user')

  // data mutations cannot be performed by Identity users
  // async issuance operations are performed as the user who created the async issuance
  const transactionUserManagerUserId = userIsIdentity ? asyncIssuanceEntity.createdById : user.entity.id

  // Mark verification as complete for Concierge path (identity verified by existing credential)
  if (userIsIdentity && asyncIssuanceEntity.state !== 'verification-complete') {
    await inTransaction(async (entityManager) => {
      asyncIssuanceEntity.state = 'verification-complete'
      await entityManager.getRepository(AsyncIssuanceEntity).save(asyncIssuanceEntity)
    }, transactionUserManagerUserId)
  }

  // validate async issuance entity state
  invariant(!asyncIssuanceEntity.isStatusFinal, 'Invalid status for issuance')

  const asyncIssuance = await services.asyncIssuances.downloadAsyncIssuance(asyncIssuanceRequestId, asyncIssuanceEntity.expiry)
  invariant(asyncIssuance, 'Async issuance request data not found')

  // authenticated identities provide photo directly to this operation, rather than via a photo capture request
  if (userIsIdentity && asyncIssuance.photoCapture) invariant(photo, 'Photo is required for this issuance')
  const faceCheckPhoto = asyncIssuance.photoCapture ? photo : undefined

  try {
    return await inTransaction(async (entityManager) => {
      const asyncIssuanceKey = getAsyncIssuanceSessionKey(user.token)

      const result = await executeIssuanceRequest(
        { ...this, entityManager },
        {
          ...asyncIssuance,
          faceCheckPhoto: asyncIssuance.faceCheckPhoto ?? faceCheckPhoto,
          includeQRCode: true,
          photoCaptureRequestId: limitedAsyncIssuanceData?.photoCaptureRequestId,
          asyncIssuanceCreatedById: asyncIssuanceEntity.createdById,
        },
      )

      // if the response is RequestErrorResponse, return it immediately
      if ('error' in result) {
        asyncIssuanceEntity.failed('issuance-failed')
        await entityManager.getRepository(AsyncIssuanceEntity).save(asyncIssuanceEntity)
        return result
      }

      const { requestResponse, issuanceId, issuedById, identity, contract, hasFaceCheckPhoto, expirationDate, photoCaptureRequestId } =
        result

      // cache issuance details using the credential record created at offer time — the async issuance
      // owns the credential record lifecycle; its credentialRecordId is stable from offer through issuance
      const requestDetails: IssuanceRequestDetails = {
        id: issuanceId,
        issuedById,
        identityId: identity.id,
        contractId: contract.id,
        expirationDate,
        photoCaptureRequestId,
        hasFaceCheckPhoto,
        asyncIssuanceKey,
        credentialRecordId: asyncIssuanceEntity.credentialRecordId,
      }
      await requestDetailsCache().set(requestResponse.requestId, JSON.stringify(requestDetails))

      logger.auditEvent(AuditEvents.ASYNC_ISSUANCE_ISSUANCE_REQUEST_CREATED, { requestId: requestResponse.requestId })

      // persist the issuance request id for subsequent retrieval
      if (limitedAsyncIssuanceData) {
        // update the limited session data
        limitedAsyncIssuanceData.issuanceRequestId = requestResponse.requestId
        await setAsyncIssuanceSessionData(user.token, limitedAsyncIssuanceData)
      } else if (userIsIdentity) {
        // establish an async issuance session for the authenticated identity
        await setAsyncIssuanceSessionData(user.token, {
          asyncIssuanceRequestId,
          contractId: asyncIssuanceEntity.contractId,
          identityId: asyncIssuanceEntity.identityId,
          userId: asyncIssuanceEntity.createdById,
          photoCapture: asyncIssuance.photoCapture ?? false,
          issuanceRequestId: requestResponse.requestId,
        })
      }

      logger.auditEvent(AuditEvents.ASYNC_ISSUANCE_REQUEST_CLAIMED)

      requestResponse.postIssuanceRedirectUrl = asyncIssuance.postIssuanceRedirectUrl
      requestResponse.credentialRecordId = asyncIssuanceEntity.credentialRecordId

      return requestResponse
    }, transactionUserManagerUserId)
  } catch (error) {
    await this.inTransaction(async (entityManager) => {
      asyncIssuanceEntity.failed('issuance-failed')
      await entityManager.getRepository(AsyncIssuanceEntity).save(asyncIssuanceEntity)
    }, transactionUserManagerUserId)
    throw error
  }
}
