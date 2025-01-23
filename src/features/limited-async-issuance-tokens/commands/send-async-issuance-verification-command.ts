import { codeExpiryMinutes, isThrottledOrSetThrottle, setVerificationCode } from '..'
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

  // validate verification info
  const verification = asyncIssuanceRequest.contact?.verification

  // no verification set
  if (!verification) return { method: null }

  // atomic check & set throttle, to prevent race conditions
  const isThrottled = await isThrottledOrSetThrottle(asyncIssuanceRequestId)
  if (isThrottled) {
    logger.warn(`Throttled verification for async issuance: ${asyncIssuanceRequestId}`)
    return { method: verification.method }
  }

  // generate a code
  const verificationCode = randomDigits(6)
  await setVerificationCode(asyncIssuanceRequestId, verificationCode)

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
