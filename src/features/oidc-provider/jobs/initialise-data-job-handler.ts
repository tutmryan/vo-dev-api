import type { JobHandler } from '../../../background-jobs/jobs'
import type { JobType } from '../../../background-jobs/queue'
import { initialiseDataFromDeduplicatedBackgroundJob } from '../data'

export type InitialiseOidcDataJobName = 'initialiseOidcData'
export type InitialiseOidcDataJobId = InitialiseOidcDataJobName
export type InitialiseOidcDataJobPayload = undefined
export type InitialiseOidcDataJobType = JobType<InitialiseOidcDataJobName, InitialiseOidcDataJobPayload>

export const initialiseOidcDataJobHandler: JobHandler<InitialiseOidcDataJobPayload> = async (_context, _job) =>
  initialiseDataFromDeduplicatedBackgroundJob()
