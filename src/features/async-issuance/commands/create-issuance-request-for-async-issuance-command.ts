import { type TransactionalCommandContext } from '../../../cqs'
import { type IssuanceRequestResponse } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userIsIdentityEntity } from '../../../util/user-invariant'
import { getAsyncIssuanceSessionKey, setAsyncIssuanceSessionData } from '../../async-issuance/session'
import { CreateIssuanceRequestCommand } from '../../issuance/commands/create-issuance-request-command'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'

export async function CreateIssuanceRequestForAsyncIssuanceCommand(
  this: TransactionalCommandContext,
  asyncIssuanceRequestId: string,
  photo?: string,
): Promise<IssuanceRequestResponse> {
  const { services, user, inTransaction } = this

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

  // validate async issuance entity state
  invariant(!asyncIssuanceEntity.isStatusFinal, 'Invalid status for issuance')

  const asyncIssuance = await services.asyncIssuances.downloadAsyncIssuance(asyncIssuanceRequestId, asyncIssuanceEntity.expiry)
  invariant(asyncIssuance, 'Async issuance request data not found')

  // authenticated identities provide photo directly to this operation, rather than via a photo capture request
  if (userIsIdentity && asyncIssuance.photoCapture) invariant(photo, 'Photo is required for this issuance')
  const faceCheckPhoto = asyncIssuance.photoCapture ? photo : undefined

  // data mutations cannot be performed by Identity users
  // async issuance operations are performed as the user who created the async issuance
  const transactionUserManagerUserId = userIsIdentity ? asyncIssuanceEntity.createdById : user.entity.id

  try {
    return await inTransaction(async (entityManager) => {
      const asyncIssuanceKey = getAsyncIssuanceSessionKey(user.token)
      const response = await CreateIssuanceRequestCommand.apply({ ...this, entityManager }, [
        {
          ...asyncIssuance,
          faceCheckPhoto: asyncIssuance.faceCheckPhoto ?? faceCheckPhoto,
          includeQRCode: true,
          photoCaptureRequestId: limitedAsyncIssuanceData?.photoCaptureRequestId,
          asyncIssuanceKey,
          asyncIssuanceCreatedById: asyncIssuanceEntity.createdById,
        },
      ])

      // if the response is RequestErrorResponse, return it immediately
      if ('error' in response) {
        asyncIssuanceEntity.failed('issuance-failed')
        await entityManager.getRepository(AsyncIssuanceEntity).save(asyncIssuanceEntity)
        return response
      }

      // persist the issuance request id for subsequent retrieval
      if ('requestId' in response) {
        if (limitedAsyncIssuanceData) {
          // update the limited session data
          limitedAsyncIssuanceData.issuanceRequestId = response.requestId
          await setAsyncIssuanceSessionData(user.token, limitedAsyncIssuanceData)
        } else if (userIsIdentity) {
          // establish an async issuance session for the authenticated identity
          await setAsyncIssuanceSessionData(user.token, {
            asyncIssuanceRequestId,
            contractId: asyncIssuanceEntity.contractId,
            identityId: asyncIssuanceEntity.identityId,
            userId: asyncIssuanceEntity.createdById,
            photoCapture: asyncIssuance.photoCapture ?? false,
            issuanceRequestId: response.requestId,
          })
        }
      }

      response.postIssuanceRedirectUrl = asyncIssuance.postIssuanceRedirectUrl

      return response
    }, transactionUserManagerUserId)
  } catch (error) {
    await this.inTransaction(async (entityManager) => {
      asyncIssuanceEntity.failed('issuance-failed')
      await entityManager.getRepository(AsyncIssuanceEntity).save(asyncIssuanceEntity)
    }, transactionUserManagerUserId)
    throw error
  }
}
