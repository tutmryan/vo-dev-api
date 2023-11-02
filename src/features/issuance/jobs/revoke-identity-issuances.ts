import { type Job } from 'bullmq'
import type { JobType } from '../../../background-jobs/queue'
import type { WorkerContext } from '../../../background-jobs/worker'
import { revokeIssuances } from './revoke-utils'

export type RevokeIdentityIssuancesJobName = 'revokeIdentityIssuances'
export type RevokeIdentityIssuancesJobPayload = { userId: string; identityId: string; correlationId?: string }
export type RevokeIdentityIssuancesJobType = JobType<RevokeIdentityIssuancesJobName, RevokeIdentityIssuancesJobPayload>

export const revokeIdentityIssuancesJobHandler = async (context: WorkerContext, job: Job<RevokeIdentityIssuancesJobPayload>) =>
  revokeIssuances(job, context, { identityId: job.data.identityId })
