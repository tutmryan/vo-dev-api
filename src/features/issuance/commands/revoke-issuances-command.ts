import { addToJobQueue } from '../../../background-jobs/queue'
import type { CommandContext } from '../../../cqrs/command-context'
import { userInvariant } from '../../../util/user-invariant'

export async function RevokeIssuancesCommand(this: CommandContext, ids: string[]): Promise<string> {
  const { user, requestInfo } = this

  userInvariant(user)

  const jobId = await addToJobQueue({
    name: 'revokeIssuances',
    payload: { userId: user.userEntity.id, issuanceIds: ids, correlationId: requestInfo.correlationId },
  })
  return jobId
}
