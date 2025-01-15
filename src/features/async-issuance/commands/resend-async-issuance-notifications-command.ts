import { addToJobQueue } from '../../../background-jobs/queue'
import type { CommandContext } from '../../../cqs'
import { userInvariant } from '../../../util/user-invariant'

export async function ResendAsyncIssuanceNotificationsCommand(this: CommandContext, asyncIssuanceRequestId: string[]): Promise<string> {
  const { user } = this

  userInvariant(user)

  const jobId = await addToJobQueue({
    name: 'sendAsyncIssuanceNotifications',
    payload: { userId: user.entity.id, asyncIssuanceRequestIds: asyncIssuanceRequestId },
  })
  return jobId
}
