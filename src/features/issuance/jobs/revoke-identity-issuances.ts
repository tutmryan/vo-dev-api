import type { JobHandler } from '../../../background-jobs/jobs'
import { revokeIssuances } from './revoke-utils'

export type RevokeIdentityIssuancesJobPayload = { identityId: string }

export const revokeIdentityIssuancesJobHandler: JobHandler<RevokeIdentityIssuancesJobPayload> = async (context, payload) =>
  revokeIssuances(context, { identityId: payload.identityId })
