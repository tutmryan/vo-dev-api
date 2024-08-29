import type { CommandContext } from '../../../cqs'
import { userInvariant } from '../../../util/user-invariant'
import type { AsyncIssuanceEntity } from '../entities/async-issuance-entity'
import { sendAsyncIssuanceNotification } from '../notification'

export async function ResendAsyncNotificationCommand(this: CommandContext, asyncIssuanceRequestId: string): Promise<AsyncIssuanceEntity> {
  userInvariant(this.user)
  return sendAsyncIssuanceNotification(
    { logger: this.logger, services: this.services, user: this.user.userEntity },
    this.entityManager,
    asyncIssuanceRequestId,
  )
}
