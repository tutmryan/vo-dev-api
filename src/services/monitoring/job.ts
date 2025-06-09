import type { ServiceState } from '.'
import { testServices, updateServiceState } from '.'
import type { JobHandler, JobResultHandler } from '../../background-jobs/jobs'

export const monitorServicesJobHandler: JobHandler = testServices
export const monitorServicesResultHandler: JobResultHandler<ServiceState> = async (result) => updateServiceState(result)
