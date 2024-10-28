import { oidcStorageService } from '..'
import type { JobHandler } from '../../../background-jobs/jobs'
import type { JobType } from '../../../background-jobs/queue'

export type InitializeKeysJobName = 'initializeOidcKeys'
export type InitializeKeysJobId = InitializeKeysJobName
export type InitializeKeysJobPayload = undefined
export type InitializeKeysJobType = JobType<InitializeKeysJobName, InitializeKeysJobPayload>

export const initializeKeysJobHandler: JobHandler<InitializeKeysJobPayload> = async (_context, _job) => {
  await oidcStorageService().initializeKeysFromDeduplicatedBackgroundJob()
}
