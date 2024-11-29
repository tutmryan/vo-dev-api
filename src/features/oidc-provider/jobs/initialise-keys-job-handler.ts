import { oidcStorageService } from '..'
import type { JobHandler } from '../../../background-jobs/jobs'
import type { JobType } from '../../../background-jobs/queue'

export type InitialiseOidcKeysJobName = 'initialiseOidcKeys'
export type InitialiseOidcKeysJobId = InitialiseOidcKeysJobName
export type InitialiseOidcKeysJobPayload = undefined
export type InitialiseOidcKeysJobType = JobType<InitialiseOidcKeysJobName, InitialiseOidcKeysJobPayload>

export const initialiseOidcKeysJobHandler: JobHandler<InitialiseOidcKeysJobPayload> = async (_context, _job) =>
  oidcStorageService().initialiseKeysFromDeduplicatedBackgroundJob()
