import type { CommandContext } from '../../../cqrs/command-context'
import { userInvariant } from '../../../util/user-invariant'
import { addToJobQueue } from '../../backgroundJob/queue'

export async function RevokeIssuancesCommand(this: CommandContext, ids: string[]): Promise<string> {
  const { user } = this

  userInvariant(user)

  const jobId = await addToJobQueue({ name: 'revokeIssuances', payload: { userId: user.userEntity.id, issuanceIds: ids } })
  return jobId
}
