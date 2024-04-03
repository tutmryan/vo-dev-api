import type { Job, JobsOptions } from 'bullmq'
import type {
  InvokeApprovalCallbackJobName,
  InvokeApprovalCallbackJobType,
} from '../features/approval-request/jobs/invoke-approval-callback'
import { invokeApprovalCallbackJobHandler } from '../features/approval-request/jobs/invoke-approval-callback'
import type { RevokeContractIssuancesJobName, RevokeContractIssuancesJobType } from '../features/issuance/jobs/revoke-contract-issuances'
import { revokeContractIssuancesJobHandler } from '../features/issuance/jobs/revoke-contract-issuances'
import type { RevokeIdentityIssuancesJobName, RevokeIdentityIssuancesJobType } from '../features/issuance/jobs/revoke-identity-issuances'
import { revokeIdentityIssuancesJobHandler } from '../features/issuance/jobs/revoke-identity-issuances'
import type { RevokeIssuancesJobName, RevokeIssuancesJobType } from '../features/issuance/jobs/revoke-issuances'
import { revokeIssuancesJobHandler } from '../features/issuance/jobs/revoke-issuances'
import type { RevokeUserIssuancesJobName, RevokeUserIssuancesJobType } from '../features/issuance/jobs/revoke-user-issuances'
import { revokeUserIssuancesJobHandler } from '../features/issuance/jobs/revoke-user-issuances'
import type { UserEntity } from '../features/users/entities/user-entity'
import type { logger } from '../logger'
import type { VerifiedIdAdminService } from '../services/verified-id'
import type { PartialRecord } from '../util/partial-record'

export type WorkerContext = {
  logger: typeof logger
  verifiedIdAdminService: VerifiedIdAdminService
  user: UserEntity
}

export interface JobPayload {
  userId: string
  requestId?: string
}

export type JobHandler<TPayload extends JobPayload = JobPayload> = (context: WorkerContext, job: Job<TPayload>) => Promise<void>

type HandlerMap<T extends { name: JobNames }> = {
  [J in T as J['name']]?: JobHandler<any>
}

export type JobNames =
  | RevokeIssuancesJobName
  | RevokeContractIssuancesJobName
  | RevokeIdentityIssuancesJobName
  | RevokeUserIssuancesJobName
  | InvokeApprovalCallbackJobName

export type JobTypes =
  | RevokeIssuancesJobType
  | RevokeContractIssuancesJobType
  | RevokeIdentityIssuancesJobType
  | RevokeUserIssuancesJobType
  | InvokeApprovalCallbackJobType

export const handlers: HandlerMap<JobTypes> = {
  revokeIssuances: revokeIssuancesJobHandler,
  revokeContractIssuances: revokeContractIssuancesJobHandler,
  revokeIdentityIssuances: revokeIdentityIssuancesJobHandler,
  revokeUserIssuances: revokeUserIssuancesJobHandler,
  invokeApprovalCallback: invokeApprovalCallbackJobHandler,
}

// override default job options for specific job handlers
export const jobOptions: PartialRecord<JobNames, JobsOptions> = {
  invokeApprovalCallback: {
    attempts: 18, // exponential backoff means final retry (2 ** 18 = 262144s) = 3 days
  },
}
