import { addToJobQueue } from '../../../background-jobs/queue'
import type { CommandContext } from '../../../cqrs/command-context'
import { userInvariant } from '../../../util/user-invariant'

export async function RevokeContractIssuancesCommand(this: CommandContext, id: string): Promise<string> {
  const { user, requestInfo } = this

  userInvariant(user)

  const jobId = await addToJobQueue({
    name: 'revokeContractIssuances',
    payload: { userId: user.userEntity.id, contractId: id, requestId: requestInfo.requestId },
  })
  return jobId
}
