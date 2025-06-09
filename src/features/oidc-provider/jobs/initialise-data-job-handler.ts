import type { JobHandler } from '../../../background-jobs/jobs'
import { initialiseDataFromDeduplicatedBackgroundJob } from '../data'

export const initialiseOidcDataJobHandler: JobHandler = async () => initialiseDataFromDeduplicatedBackgroundJob()
