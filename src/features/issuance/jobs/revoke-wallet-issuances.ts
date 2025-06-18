import type { JobHandler } from '../../../background-jobs/jobs'
import { revokeWalletIssuances } from './revoke-utils'

export type RevokeWalletIssuancesJobPayload = {
  walletId: string
}

export const revokeWalletIssuancesJobHandler: JobHandler<RevokeWalletIssuancesJobPayload> = async (context, payload) =>
  revokeWalletIssuances(context, payload.walletId)
