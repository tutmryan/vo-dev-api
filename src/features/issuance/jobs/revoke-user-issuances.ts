import { type Job } from 'bullmq'
import type { JobType } from '../../../background-jobs/queue'
import type { WorkerContext } from '../../../background-jobs/worker'
import { revokeIssuances } from './revoke-utils'

export type RevokeUserIssuancesJobName = 'revokeUserIssuances'
export type RevokeUserIssuancesJobPayload = { userId: string; issuedById: string; correlationId?: string }
export type RevokeUserIssuancesJobType = JobType<RevokeUserIssuancesJobName, RevokeUserIssuancesJobPayload>

export const revokeUserIssuancesJobHandler = async (context: WorkerContext, job: Job<RevokeUserIssuancesJobPayload>) =>
  revokeIssuances(job, context, { issuedById: job.data.issuedById })
