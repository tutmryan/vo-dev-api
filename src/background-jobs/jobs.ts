import type { BaseRequestInfo } from '@makerx/graphql-core'
import { isLocalDev } from '@makerx/node-common'
import type { JobsOptions } from 'bullmq'
import type { VerifiedOrchestrationEntityManager } from '../data/entity-manager'
import type { InvokeApprovalCallbackJobPayload } from '../features/approval-request/jobs/invoke-approval-callback'
import { invokeApprovalCallbackJobHandler } from '../features/approval-request/jobs/invoke-approval-callback'
import type { CancelAsyncIssuanceRequestsJobPayload } from '../features/async-issuance/jobs/cancel-async-issuance-requests'
import { cancelAsyncIssuanceRequestsHandler } from '../features/async-issuance/jobs/cancel-async-issuance-requests'
import type { SendAsyncIssuanceNotificationsJobPayload } from '../features/async-issuance/jobs/send-async-issuance-notifications'
import { sendAsyncIssuanceNotificationsJobHandler } from '../features/async-issuance/jobs/send-async-issuance-notifications'
import type { RevokeContractIssuancesJobPayload } from '../features/issuance/jobs/revoke-contract-issuances'
import { revokeContractIssuancesJobHandler } from '../features/issuance/jobs/revoke-contract-issuances'
import {
  revokeIdentityIssuancesJobHandler,
  type RevokeIdentityIssuancesJobPayload,
} from '../features/issuance/jobs/revoke-identity-issuances'
import { revokeIssuancesJobHandler, type RevokeIssuancesJobPayload } from '../features/issuance/jobs/revoke-issuances'
import { revokeUserIssuancesJobHandler, type RevokeUserIssuancesJobPayload } from '../features/issuance/jobs/revoke-user-issuances'
import { revokeWalletIssuancesJobHandler, type RevokeWalletIssuancesJobPayload } from '../features/issuance/jobs/revoke-wallet-issuances'
import { applyOidcSigningKeysRotationJobHandler } from '../features/oidc-provider/jobs/apply-oidc-key-rotation'
import { initialiseOidcDataJobHandler } from '../features/oidc-provider/jobs/initialise-data-job-handler'
import { initialiseOidcKeysJobHandler } from '../features/oidc-provider/jobs/initialise-keys-job-handler'
import type { UserEntity } from '../features/users/entities/user-entity'
import type { logger } from '../logger'
import { ONE_MINUTE_TTL } from '../redis/cache'
import type { AsyncIssuanceService } from '../services/async-issuance-service'
import type { CommunicationsService } from '../services/communications-service'
import type { ServiceErrors } from '../services/monitoring'
import { monitorServicesJobHandler, monitorServicesResultHandler } from '../services/monitoring/job'
import type { VerifiedIdAdminService } from '../services/verified-id/admin'

export type JobPayload<TData = unknown> = {
  userId?: string
  requestInfo?: BaseRequestInfo
} & TData

export type HandlerContext = {
  logger: typeof logger
  user: UserEntity
  entityManager: VerifiedOrchestrationEntityManager
  requestInfo?: BaseRequestInfo
  updateProgress(progress: number | object): Promise<void>
  jobAuditMetadata: { jobId: string; jobData: unknown }
  services: {
    verifiedIdAdmin: VerifiedIdAdminService
    asyncIssuances: AsyncIssuanceService
    communications: CommunicationsService
  }
}

// https://docs.bullmq.io/guide/job-schedulers/repeat-strategies
export type JobSchedule = { every: number } | { pattern: string }
export type JobHandler<TData = unknown, TResult = unknown> = (context: HandlerContext, payload: JobPayload<TData>) => Promise<TResult>
export type JobResultHandler<TResult = unknown> = (result: TResult) => Promise<void>
export type JobConfig<TData = unknown, TResult = unknown> = {
  handler: JobHandler<TData, TResult>
  options?: JobsOptions
  schedule?: JobSchedule
  /**
   * Optional handler for receiving the result of the job after it has completed successfully.
   * This handler is invoked via pubsub subscription, on all instances, not just the one that processed the job.
   * For example, updating in-memory state based on the result of a job.
   */
  jobResultHandler?: JobResultHandler<TResult>
  resultCacheTtl?: number
  disableImplicitTransaction?: boolean
}

// TTL for deduplication of initialisation jobs
// For localdev we don't want to be prevented from running init job code changes for long
// For deployed instances we want a safety margin which:
//   A) covers a deployment which may take a few minutes
//   B) not too long, to avoid preventing subsequent deployments from being able to run new versions of those jobs
const INIT_JOB_LOCALDEV_DEDUP_TTL = ONE_MINUTE_TTL
const INIT_JOB_DEPLOYED_DEDUP_TTL = ONE_MINUTE_TTL * 10
const INITIALISATION_JOBS_DEDUPLICATION_TTL = isLocalDev ? INIT_JOB_LOCALDEV_DEDUP_TTL : INIT_JOB_DEPLOYED_DEDUP_TTL

export type Jobs = {
  revokeIssuances: JobConfig<RevokeIssuancesJobPayload>
  revokeContractIssuances: JobConfig<RevokeContractIssuancesJobPayload>
  revokeIdentityIssuances: JobConfig<RevokeIdentityIssuancesJobPayload>
  revokeUserIssuances: JobConfig<RevokeUserIssuancesJobPayload>
  revokeWalletIssuances: JobConfig<RevokeWalletIssuancesJobPayload>
  invokeApprovalCallback: JobConfig<InvokeApprovalCallbackJobPayload>
  sendAsyncIssuanceNotifications: JobConfig<SendAsyncIssuanceNotificationsJobPayload>
  cancelAsyncIssuanceRequests: JobConfig<CancelAsyncIssuanceRequestsJobPayload>
  initialiseOidcKeys: JobConfig
  initialiseOidcData: JobConfig
  monitorServices: JobConfig<unknown, ServiceErrors>
  applyOidcSigningKeysRotation: JobConfig
}

export const jobs: Jobs = {
  revokeIssuances: {
    handler: revokeIssuancesJobHandler,
    disableImplicitTransaction: true,
  },
  revokeContractIssuances: {
    handler: revokeContractIssuancesJobHandler,
    disableImplicitTransaction: true,
  },
  revokeIdentityIssuances: {
    handler: revokeIdentityIssuancesJobHandler,
    disableImplicitTransaction: true,
  },
  revokeUserIssuances: {
    handler: revokeUserIssuancesJobHandler,
    disableImplicitTransaction: true,
  },
  revokeWalletIssuances: {
    handler: revokeWalletIssuancesJobHandler,
    disableImplicitTransaction: true,
  },
  invokeApprovalCallback: {
    handler: invokeApprovalCallbackJobHandler,
    options: {
      attempts: 18, // exponential backoff means final retry (2 ** 18 = 262144s) = 3 days
    },
  },
  sendAsyncIssuanceNotifications: {
    handler: sendAsyncIssuanceNotificationsJobHandler,
    disableImplicitTransaction: true,
  },
  cancelAsyncIssuanceRequests: {
    handler: cancelAsyncIssuanceRequestsHandler,
    disableImplicitTransaction: true,
  },
  initialiseOidcKeys: {
    handler: initialiseOidcKeysJobHandler,
    resultCacheTtl: INITIALISATION_JOBS_DEDUPLICATION_TTL,
    options: {
      deduplication: {
        id: 'initialiseOidcKeys',
        ttl: INITIALISATION_JOBS_DEDUPLICATION_TTL,
      },
    },
  },
  initialiseOidcData: {
    handler: initialiseOidcDataJobHandler,
    resultCacheTtl: INITIALISATION_JOBS_DEDUPLICATION_TTL,
    options: {
      deduplication: {
        id: 'initialiseOidcData',
        ttl: INITIALISATION_JOBS_DEDUPLICATION_TTL,
      },
    },
    disableImplicitTransaction: true,
  },
  monitorServices: {
    handler: monitorServicesJobHandler,
    jobResultHandler: monitorServicesResultHandler,
    schedule: { every: 5 * 60 * 1000 }, // every 5 minutes
    resultCacheTtl: 0, // no caching of results, as we want to always run the job when queued
  },
  applyOidcSigningKeysRotation: {
    handler: applyOidcSigningKeysRotationJobHandler,
    schedule: {
      pattern: '0 0 1 * * *', // every day at 1am
    },
  },
}

export function getJobConfig(name: string) {
  return jobs[name as keyof Jobs] as JobConfig | undefined
}
