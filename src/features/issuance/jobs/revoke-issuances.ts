import type { Job } from 'bullmq'
import { In } from 'typeorm'
import type { JobType } from '../../../background-jobs/queue'
import type { WorkerContext } from '../../../background-jobs/worker'
import { revokeIssuances } from './revoke-utils'

export type RevokeIssuancesJobName = 'revokeIssuances'
export type RevokeIssuancesJobPayload = { userId: string; issuanceIds: string[]; requestId?: string }
export type RevokeIssuancesJobType = JobType<RevokeIssuancesJobName, RevokeIssuancesJobPayload>

export const revokeIssuancesJobHandler = async (context: WorkerContext, job: Job<RevokeIssuancesJobPayload>) =>
  revokeIssuances(job, context, { id: In(job.data.issuanceIds) })
