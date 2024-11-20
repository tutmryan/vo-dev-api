import type { Job, JobsOptions } from 'bullmq'
import type {
  InvokeApprovalCallbackJobName,
  InvokeApprovalCallbackJobType,
} from '../features/approval-request/jobs/invoke-approval-callback'
import { invokeApprovalCallbackJobHandler } from '../features/approval-request/jobs/invoke-approval-callback'
import type {
  CancelAsyncIssuanceRequestsJobName,
  CancelAsyncIssuanceRequestsJobType,
} from '../features/async-issuance/jobs/cancel-async-issuance-requests'
import { cancelAsyncIssuanceRequestsHandler } from '../features/async-issuance/jobs/cancel-async-issuance-requests'
import type {
  SendAsyncIssuanceNotificationsJobName,
  SendAsyncIssuanceNotificationsJobType,
} from '../features/async-issuance/jobs/send-async-issuance-notifications'
import { sendAsyncIssuanceNotificationsJobHandler } from '../features/async-issuance/jobs/send-async-issuance-notifications'
import type { RevokeContractIssuancesJobName, RevokeContractIssuancesJobType } from '../features/issuance/jobs/revoke-contract-issuances'
import { revokeContractIssuancesJobHandler } from '../features/issuance/jobs/revoke-contract-issuances'
import type { RevokeIdentityIssuancesJobName, RevokeIdentityIssuancesJobType } from '../features/issuance/jobs/revoke-identity-issuances'
import { revokeIdentityIssuancesJobHandler } from '../features/issuance/jobs/revoke-identity-issuances'
import type { RevokeIssuancesJobName, RevokeIssuancesJobType } from '../features/issuance/jobs/revoke-issuances'
import { revokeIssuancesJobHandler } from '../features/issuance/jobs/revoke-issuances'
import type { RevokeUserIssuancesJobName, RevokeUserIssuancesJobType } from '../features/issuance/jobs/revoke-user-issuances'
import { revokeUserIssuancesJobHandler } from '../features/issuance/jobs/revoke-user-issuances'
import {
  initialiseOidcDataJobHandler,
  type InitialiseOidcDataJobName,
  type InitialiseOidcDataJobType,
} from '../features/oidc-provider/jobs/initialise-data-job-handler'
import type { InitialiseOidcKeysJobName, InitialiseOidcKeysJobType } from '../features/oidc-provider/jobs/initialise-keys-job-handler'
import { initializeOidcKeysJobHandler } from '../features/oidc-provider/jobs/initialise-keys-job-handler'
import type { UserEntity } from '../features/users/entities/user-entity'
import type { logger } from '../logger'
import { ONE_MINUTE_TTL } from '../redis/cache'
import type { Services } from '../services'
import type { PartialRecord } from '../util/partial-record'

export type WorkerContext = {
  logger: typeof logger
  user?: UserEntity
  services: Pick<Services, 'verifiedIdAdmin' | 'asyncIssuances' | 'communications'>
}

export type JobPayload =
  | undefined
  | {
      userId: string
      requestId?: string
    }

export type JobHandler<TPayload extends JobPayload = JobPayload> = (context: WorkerContext, job: Job<TPayload>) => Promise<void>

type HandlerMap<T extends { name: JobNames }> = {
  [J in T as J['name']]?: JobHandler<any | never>
}

export type JobNames =
  | RevokeIssuancesJobName
  | RevokeContractIssuancesJobName
  | RevokeIdentityIssuancesJobName
  | RevokeUserIssuancesJobName
  | InvokeApprovalCallbackJobName
  | SendAsyncIssuanceNotificationsJobName
  | CancelAsyncIssuanceRequestsJobName
  | InitialiseOidcKeysJobName
  | InitialiseOidcDataJobName

export type JobTypes =
  | RevokeIssuancesJobType
  | RevokeContractIssuancesJobType
  | RevokeIdentityIssuancesJobType
  | RevokeUserIssuancesJobType
  | InvokeApprovalCallbackJobType
  | SendAsyncIssuanceNotificationsJobType
  | CancelAsyncIssuanceRequestsJobType
  | InitialiseOidcKeysJobType
  | InitialiseOidcDataJobType

export const handlers: HandlerMap<JobTypes> = {
  revokeIssuances: revokeIssuancesJobHandler,
  revokeContractIssuances: revokeContractIssuancesJobHandler,
  revokeIdentityIssuances: revokeIdentityIssuancesJobHandler,
  revokeUserIssuances: revokeUserIssuancesJobHandler,
  invokeApprovalCallback: invokeApprovalCallbackJobHandler,
  sendAsyncIssuanceNotifications: sendAsyncIssuanceNotificationsJobHandler,
  cancelAsyncIssuanceRequests: cancelAsyncIssuanceRequestsHandler,
  initialiseOidcKeys: initializeOidcKeysJobHandler,
  initialiseOidcData: initialiseOidcDataJobHandler,
}

// override default job options for specific job handlers
export const jobOptions: PartialRecord<JobNames, JobsOptions & { resultCacheTtl?: number }> = {
  invokeApprovalCallback: {
    attempts: 18, // exponential backoff means final retry (2 ** 18 = 262144s) = 3 days
  },
  initialiseOidcData: {
    resultCacheTtl: ONE_MINUTE_TTL, // 1 minute - we don't need this data cached for longer than it takes to run the deduplicated job; a shorter TTL allows re-initialisation to take place sooner, when necessary, e.g. for localdev after switching ngrok URLs
  },
}
