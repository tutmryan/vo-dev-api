import type { JobHandler, JobPayload } from '../../../background-jobs/jobs'
import type { JobType } from '../../../background-jobs/queue'
import { revokeIssuances } from './revoke-utils'

export type RevokeIdentityIssuancesJobName = 'revokeIdentityIssuances'
export type RevokeIdentityIssuancesJobPayload = JobPayload & { identityId: string }
export type RevokeIdentityIssuancesJobType = JobType<RevokeIdentityIssuancesJobName, RevokeIdentityIssuancesJobPayload>

export const revokeIdentityIssuancesJobHandler: JobHandler<RevokeIdentityIssuancesJobPayload> = async (context, job) =>
  revokeIssuances(job, context, { identityId: job.data.identityId })
