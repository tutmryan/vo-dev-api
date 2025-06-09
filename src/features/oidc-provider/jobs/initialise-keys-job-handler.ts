import { oidcStorageService } from '..'
import type { JobHandler } from '../../../background-jobs/jobs'

export const initialiseOidcKeysJobHandler: JobHandler = async () => oidcStorageService().initialiseKeysFromDeduplicatedBackgroundJob()
