import { addToJobQueue } from '../../../background-jobs/queue'
import type { CommandContext } from '../../../cqs'
import { userInvariant } from '../../../util/user-invariant'

export async function CancelAsyncIssuanceRequestsCommand(this: CommandContext, asyncIssuanceRequestIds: string[]) {
  const { user, requestInfo } = this
  userInvariant(user)
  return await addToJobQueue({
    name: 'cancelAsyncIssuanceRequests',
    payload: { userId: user.entity.id, asyncIssuanceRequestIds, requestId: requestInfo.requestId },
  })
}
