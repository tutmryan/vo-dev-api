import type { JobHandler } from '../../../background-jobs/jobs'
import { revokeIssuances } from './revoke-utils'

export type RevokeUserIssuancesJobPayload = { issuedById: string }

export const revokeUserIssuancesJobHandler: JobHandler<RevokeUserIssuancesJobPayload> = async (context, payload) =>
  revokeIssuances(context, { issuedById: payload.issuedById })
