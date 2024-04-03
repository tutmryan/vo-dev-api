import { In } from 'typeorm'
import type { JobHandler, JobPayload } from '../../../background-jobs/jobs'
import type { JobType } from '../../../background-jobs/queue'
import { revokeIssuances } from './revoke-utils'

export type RevokeIssuancesJobName = 'revokeIssuances'
export type RevokeIssuancesJobPayload = JobPayload & { issuanceIds: string[] }
export type RevokeIssuancesJobType = JobType<RevokeIssuancesJobName, RevokeIssuancesJobPayload>

export const revokeIssuancesJobHandler: JobHandler<RevokeIssuancesJobPayload> = async (context, job) =>
  revokeIssuances(job, context, { id: In(job.data.issuanceIds) })
