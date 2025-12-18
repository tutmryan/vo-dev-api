import { AuditEvents } from '../../../audit-types'
import { addToJobQueue } from '../../../background-jobs'
import type { CommandContext } from '../../../cqs'
import { userInvariant } from '../../../util/user-invariant'

export async function ResendAsyncIssuanceNotificationsCommand(this: CommandContext, asyncIssuanceRequestIds: string[]): Promise<string> {
  const { user, logger } = this
  userInvariant(user)
  asyncIssuanceRequestIds.forEach((asyncIssuanceRequestId) => {
    logger.auditEvent(AuditEvents.ASYNC_ISSUANCE_NOTIFICATION_RESEND_QUEUED, {
      asyncIssuanceRequestId,
    })
  })
  const jobId = await addToJobQueue('sendAsyncIssuanceNotifications', {
    userId: user.entity.id,
    asyncIssuanceRequestIds,
  })
  return jobId
}
