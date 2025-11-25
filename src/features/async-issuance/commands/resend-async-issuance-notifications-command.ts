import { addToJobQueue } from '../../../background-jobs'
import type { CommandContext } from '../../../cqs'
import { userInvariant } from '../../../util/user-invariant'

export async function ResendAsyncIssuanceNotificationsCommand(this: CommandContext, asyncIssuanceRequestIds: string[]): Promise<string> {
  const { user, logger } = this
  userInvariant(user)
  asyncIssuanceRequestIds.forEach((asyncIssuanceRequestId) => {
    logger.audit(`Async issuance request notification resend queued`, { asyncIssuanceRequestId })
  })
  const jobId = await addToJobQueue('sendAsyncIssuanceNotifications', {
    userId: user.entity.id,
    asyncIssuanceRequestIds,
  })
  return jobId
}
