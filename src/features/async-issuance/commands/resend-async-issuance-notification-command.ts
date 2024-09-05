import type { MultiTransactionalCommandContext } from '../../../cqs'
import type { CommandContext } from '../../../cqs'
import { CommunicationError } from '../../../services/communications-service'
import { userInvariant } from '../../../util/user-invariant'
import { AsyncIssuanceEntity } from '../entities/async-issuance-entity'
import { sendAsyncIssuanceNotification } from '../notification'

export async function ResendAsyncNotificationCommand(
  this: MultiTransactionalCommandContext,
  asyncIssuanceRequestId: string,
): Promise<AsyncIssuanceEntity> {
  try {
    return await this.runInTransaction((context: CommandContext) => {
      userInvariant(context.user)
      return sendAsyncIssuanceNotification(
        { logger: context.logger, services: context.services, user: context.user.userEntity },
        context.entityManager,
        asyncIssuanceRequestId,
      )
    })
  } catch (error) {
    await this.runInTransaction(async (context: CommandContext) => {
      userInvariant(context.user)

      const repository = context.entityManager.getRepository(AsyncIssuanceEntity)
      const asyncIssuance = await repository.findOneByOrFail({ id: asyncIssuanceRequestId })
      asyncIssuance.failed('Failed to send notification')
      await repository.save(asyncIssuance)

      if (error instanceof CommunicationError) {
        await context.services.communications.recordCommunicationFailure(error, context.entityManager)
      }
    })
    throw error
  }
}
