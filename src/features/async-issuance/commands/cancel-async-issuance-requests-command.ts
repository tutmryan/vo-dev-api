import { addToJobQueue } from '../../../background-jobs'
import type { CommandContext } from '../../../cqs'
import { userInvariant } from '../../../util/user-invariant'

export async function CancelAsyncIssuanceRequestsCommand(this: CommandContext, asyncIssuanceRequestIds: string[]) {
  const { user, requestInfo, logger } = this
  userInvariant(user)
  asyncIssuanceRequestIds.forEach((asyncIssuanceRequestId) => {
    logger.audit(`Async issuance request cancellation queued`, { asyncIssuanceRequestId })
  })
  return await addToJobQueue('cancelAsyncIssuanceRequests', {
    userId: user.entity.id,
    asyncIssuanceRequestIds,
    requestId: requestInfo.requestId,
  })
}
