import type { JobHandler, JobPayload } from '../../../background-jobs/jobs'
import type { JobType } from '../../../background-jobs/queue'
import { revokeIssuances } from './revoke-utils'

export type RevokeUserIssuancesJobName = 'revokeUserIssuances'
export type RevokeUserIssuancesJobPayload = JobPayload & { issuedById: string }
export type RevokeUserIssuancesJobType = JobType<RevokeUserIssuancesJobName, RevokeUserIssuancesJobPayload>

export const revokeUserIssuancesJobHandler: JobHandler<RevokeUserIssuancesJobPayload> = async (context, job) =>
  revokeIssuances(job, context, { issuedById: job.data.issuedById })
