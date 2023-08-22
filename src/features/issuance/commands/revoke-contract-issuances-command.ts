import type { CommandContext } from '../../../cqrs/command-context'
import { userInvariant } from '../../../util/user-invariant'
import { addToJobQueue } from '../../backgroundJob/queue'

export async function RevokeContractIssuancesCommand(this: CommandContext, id: string): Promise<string> {
  const { user } = this

  userInvariant(user)

  const jobId = await addToJobQueue({ name: 'revokeContractIssuances', payload: { userId: user.userEntity.id, contractId: id } })
  return jobId
}
