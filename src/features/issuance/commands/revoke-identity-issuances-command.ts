import { addToJobQueue } from '../../../background-jobs/queue'
import type { CommandContext } from '../../../cqrs/command-context'
import { userInvariant } from '../../../util/user-invariant'

export async function RevokeIdentityIssuancesCommand(this: CommandContext, id: string): Promise<string> {
  const { user, requestInfo } = this

  userInvariant(user)

  const jobId = await addToJobQueue({
    correlationId: requestInfo.correlationId,
    name: 'revokeIdentityIssuances',
    payload: { userId: user.userEntity.id, identityId: id },
  })
  return jobId
}
