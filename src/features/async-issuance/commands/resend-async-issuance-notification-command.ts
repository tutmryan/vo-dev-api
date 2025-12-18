import { AuditEvents } from '../../../audit-types'
import type { TransactionalCommandContext } from '../../../cqs'
import { CommunicationError } from '../../../services/communications-service'
import { userInvariant } from '../../../util/user-invariant'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'
import { sendAsyncIssuanceNotification } from '../notification'

export async function ResendAsyncNotificationCommand(
  this: TransactionalCommandContext,
  asyncIssuanceRequestId: string,
): Promise<AsyncIssuanceEntity> {
  const { services, user, inTransaction, logger } = this

  logger.mergeMeta({
    asyncIssuanceRequestId,
  })

  userInvariant(user)

  try {
    return await inTransaction((entityManager) => {
      return sendAsyncIssuanceNotification({ services, logger }, entityManager, asyncIssuanceRequestId)
    })
  } catch (error) {
    await inTransaction(async (entityManager) => {
      const repository = entityManager.getRepository(AsyncIssuanceEntity)
      const asyncIssuance = await repository.findOneByOrFail({ id: asyncIssuanceRequestId })
      asyncIssuance.failed('contact-failed')
      await repository.save(asyncIssuance)

      if (error instanceof CommunicationError) {
        await services.communications.recordCommunicationFailure(error, entityManager)
      }
      logger.auditEvent(AuditEvents.ASYNC_ISSUANCE_NOTIFICATION_RESEND_FAILED)
    })
    throw error
  }
}
