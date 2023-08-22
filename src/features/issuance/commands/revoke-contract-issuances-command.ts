import type { CommandContext } from '../../../cqrs/command-context'
import { userInvariant } from '../../../util/user-invariant'
import { addToJobQueue } from '../../backgroundJob/queue'

export async function RevokeContractIssuancesCommand(this: CommandContext, id: string): Promise<string> {
  const { user, correlationId } = this

  userInvariant(user)

  const jobId = await addToJobQueue({
    correlationId,
    name: 'revokeContractIssuances',
    payload: { userId: user.userEntity.id, contractId: id },
  })
  return jobId
}
