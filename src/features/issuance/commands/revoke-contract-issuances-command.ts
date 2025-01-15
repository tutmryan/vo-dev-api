import { addToJobQueue } from '../../../background-jobs/queue'
import type { CommandContext } from '../../../cqs'
import { userInvariant } from '../../../util/user-invariant'

export async function RevokeContractIssuancesCommand(this: CommandContext, id: string): Promise<string> {
  const { user, requestInfo } = this

  userInvariant(user)

  const jobId = await addToJobQueue({
    name: 'revokeContractIssuances',
    payload: { userId: user.entity.id, contractId: id, requestId: requestInfo.requestId },
  })
  return jobId
}
