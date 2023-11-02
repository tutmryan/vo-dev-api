import { addToJobQueue } from '../../../background-jobs/queue'
import type { CommandContext } from '../../../cqrs/command-context'
import { userInvariant } from '../../../util/user-invariant'

export async function RevokeIdentityIssuancesCommand(this: CommandContext, id: string): Promise<string> {
  const { user, requestInfo } = this

  userInvariant(user)

  const jobId = await addToJobQueue({
    name: 'revokeIdentityIssuances',
    payload: { userId: user.userEntity.id, identityId: id, correlationId: requestInfo.correlationId },
  })
  return jobId
}
