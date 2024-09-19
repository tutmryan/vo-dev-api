import { codeExpiryMinutes, isAsyncIssuanceVerificationThrottled, setVerificationCode, throttleVerificationForIssuance } from '..'
import type { TransactionalCommandContext } from '../../../cqs'
import type { SendAsyncIssuanceVerificationResponse } from '../../../generated/graphql'
import { CommunicationError } from '../../../services/communications-service'
import { invariant } from '../../../util/invariant'
import { randomDigits } from '../../../util/random-digits'
import { AsyncIssuanceEntity } from '../../async-issuance/entities/async-issuance-entity'
import { addUserToManager } from '../../auditing/user-context-helper'

export async function SendAsyncIssuanceVerificationCommand(
  this: TransactionalCommandContext,
  asyncIssuanceRequestId: string,
): Promise<SendAsyncIssuanceVerificationResponse> {
  const {
    inTransaction,
    services: { asyncIssuances, communications },
    logger,
  } = this

  // locate the async issuance entity
  const asyncIssuanceEntity = await inTransaction(async (entityManager) => {
    return await entityManager.getRepository(AsyncIssuanceEntity).findOneByOrFail({ id: asyncIssuanceRequestId })
  })

  invariant(!asyncIssuanceEntity.isStatusFinal, `Invalid async issuance status for verification: ${asyncIssuanceEntity.status}`)

  // load async issuance data
  const asyncIssuanceRequest = await asyncIssuances.downloadAsyncIssuance(asyncIssuanceRequestId, asyncIssuanceEntity.expiry)
  invariant(asyncIssuanceRequest, 'Failed to download async issuance details')
  const verification = asyncIssuanceRequest.contact.verification ?? asyncIssuanceRequest.contact.notification

  // avoid execution if the async issuance is throttled
  const isThrottled = await isAsyncIssuanceVerificationThrottled(asyncIssuanceEntity.id)
  if (isThrottled) {
    logger.warn(`Throttling verification for async issuance: ${asyncIssuanceEntity.id}`)
    return { method: verification.method }
  }

  // generate a code
  const verificationCode = randomDigits(6)
  await setVerificationCode(asyncIssuanceRequestId, verificationCode)

  // throttle further verification attempts for this issuance
  await throttleVerificationForIssuance(asyncIssuanceEntity.id)

  // send verification
  try {
    return await inTransaction(async (entityManager) => {
      addUserToManager(entityManager, asyncIssuanceEntity.createdById)
      await communications.sendVerification(
        verification.value,
        {
          verificationCode,
          codeExpiryMinutes,
          contactMethod: verification.method,
          recipientId: asyncIssuanceEntity.identityId,
          createdById: asyncIssuanceEntity.createdById,
          asyncIssuanceId: asyncIssuanceEntity.id,
          contractName: (await asyncIssuanceEntity.contract).name,
          identityName: (await asyncIssuanceEntity.identity).name,
          issuer: (await asyncIssuanceEntity.contract).display.card.issuedBy,
        },
        entityManager,
      )

      return { method: verification.method }
    })
  } catch (error) {
    await inTransaction(async (entityManager) => {
      addUserToManager(entityManager, asyncIssuanceEntity.createdById)

      asyncIssuanceEntity.failed('issuance-verification-failed')
      await entityManager.getRepository(AsyncIssuanceEntity).save(asyncIssuanceEntity)

      if (error instanceof CommunicationError) {
        await communications.recordCommunicationFailure(error, entityManager)
      }
    })

    throw error
  }
}
