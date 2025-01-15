import { addToJobQueue } from '../../../background-jobs/queue'
import type { CommandContext } from '../../../cqs'
import { userInvariant } from '../../../util/user-invariant'

export async function RevokeUserIssuancesCommand(this: CommandContext, id: string): Promise<string> {
  const { user, requestInfo } = this

  userInvariant(user)

  const jobId = await addToJobQueue({
    name: 'revokeUserIssuances',
    payload: { userId: user.entity.id, issuedById: id, requestId: requestInfo.requestId },
  })
  return jobId
}
