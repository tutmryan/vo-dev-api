import { codeExpiryMinutes, isAsyncIssuanceVerificationThrottled, setVerificationCode, throttleVerificationForIssuance } from '..'
import type { CommandContext, MultiTransactionalCommandContext } from '../../../cqs'
import type { SendAsyncIssuanceVerificationResponse } from '../../../generated/graphql'
import { CommunicationError } from '../../../services/communications-service'
import { invariant } from '../../../util/invariant'
import { randomDigits } from '../../../util/random-digits'
import { AsyncIssuanceEntity } from '../../async-issuance/entities/async-issuance-entity'
import { addUserToManager } from '../../auditing/user-context-helper'

export async function SendAsyncIssuanceVerificationCommand(
  this: MultiTransactionalCommandContext,
  asyncIssuanceRequestId: string,
): Promise<SendAsyncIssuanceVerificationResponse> {
  const asyncIssuanceEntity = await this.runInTransaction(async (context: CommandContext) => {
    const { entityManager } = context

    // validate async issuance entity
    const entity = await entityManager.getRepository(AsyncIssuanceEntity).findOneByOrFail({ id: asyncIssuanceRequestId })
    invariant(!entity.isStatusFinal, `Invalid async issuance status for verification: ${entity.status}`)

    return entity
  })

  try {
    return await this.runInTransaction(async (context: CommandContext) => {
      const {
        entityManager,
        services: { asyncIssuances, communications },
        logger,
      } = context

      // load async issuance data
      const asyncIssuanceRequest = await asyncIssuances.downloadAsyncIssuance(asyncIssuanceRequestId, asyncIssuanceEntity.expiry)
      invariant(asyncIssuanceRequest, 'Failed to download async issuance details')
      const verification = asyncIssuanceRequest.contact.verification ?? asyncIssuanceRequest.contact.notification

      // throttle subsequent verification, if necessary
      const isThrottled = await isAsyncIssuanceVerificationThrottled(asyncIssuanceEntity.id)
      if (isThrottled) {
        logger.warn(`Throttling verification for async issuance: ${asyncIssuanceEntity.id}`)
        return { method: verification.method }
      }

      // generate a code
      const verificationCode = randomDigits(6)
      await setVerificationCode(asyncIssuanceRequestId, verificationCode)

      // send verification
      await communications.sendVerification(
        verification.value,
        {
          verificationCode,
          codeExpiryMinutes,
          contactMethod: verification.method,
          recipientId: asyncIssuanceEntity.identityId,
          createdById: asyncIssuanceEntity.createdById,
          asyncIssuanceId: asyncIssuanceEntity.id,
        },
        entityManager,
      )

      // throttle further verifications
      await throttleVerificationForIssuance(asyncIssuanceEntity.id)

      return { method: verification.method }
    })
  } catch (error) {
    await this.runInTransaction(async (context: CommandContext) => {
      const { entityManager } = context
      addUserToManager(entityManager, asyncIssuanceEntity.createdById)

      asyncIssuanceEntity.failed('issuance-verification-failed')
      await entityManager.getRepository(AsyncIssuanceEntity).save(asyncIssuanceEntity)

      if (error instanceof CommunicationError) {
        await context.services.communications.recordCommunicationFailure(error, entityManager)
      }
    })

    throw error
  }
}
