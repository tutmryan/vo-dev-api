import { addToJobQueue } from '../../../background-jobs/queue'
import type { CommandContext } from '../../../cqs'
import { userInvariant } from '../../../util/user-invariant'

export async function RevokeIssuancesCommand(this: CommandContext, ids: string[]): Promise<string> {
  const { user, requestInfo } = this

  userInvariant(user)

  const jobId = await addToJobQueue({
    name: 'revokeIssuances',
    payload: { userId: user.entity.id, issuanceIds: ids, requestId: requestInfo.requestId },
  })
  return jobId
}
