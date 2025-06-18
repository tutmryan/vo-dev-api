import { addToJobQueue } from '../../../background-jobs'
import type { CommandContext } from '../../../cqs'
import { userInvariant } from '../../../util/user-invariant'

export async function RevokeWalletIssuancesCommand(this: CommandContext, walletId: string): Promise<string> {
  const { user, requestInfo } = this

  userInvariant(user)

  const jobId = await addToJobQueue('revokeWalletIssuances', { userId: user.entity.id, walletId, requestId: requestInfo.requestId })
  return jobId
}
