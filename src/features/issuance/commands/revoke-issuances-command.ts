import type { CommandContext } from '../../../cqrs/command-context'
import { userInvariant } from '../../../util/user-invariant'
import { addToJobQueue } from '../../backgroundJob/queue'

export async function RevokeIssuancesCommand(this: CommandContext, ids: string[]): Promise<string> {
  const { user, requestInfo } = this

  userInvariant(user)

  const jobId = await addToJobQueue({
    correlationId: requestInfo.correlationId,
    name: 'revokeIssuances',
    payload: { userId: user.userEntity.id, issuanceIds: ids },
  })
  return jobId
}
