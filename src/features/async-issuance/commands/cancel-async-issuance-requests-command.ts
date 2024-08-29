import type { CommandContext } from '../../../cqs'
import { userInvariant } from '../../../util/user-invariant'
import { addToJobQueue } from '../../../background-jobs/queue'

export async function CancelAsyncIssuanceRequestsCommand(this: CommandContext, asyncIssuanceRequestIds: string[]) {
  const { user, requestInfo } = this
  userInvariant(user)
  return await addToJobQueue({
    name: 'cancelAsyncIssuanceRequests',
    payload: { userId: user.userEntity.id, asyncIssuanceRequestIds, requestId: requestInfo.requestId },
  })
}
