import type { ServiceErrors } from '.'
import { testServices, updateServiceState } from '.'
import type { JobHandler, JobResultHandler } from '../../background-jobs/jobs'

export const monitorServicesJobHandler: JobHandler = testServices
export const monitorServicesResultHandler: JobResultHandler<Partial<ServiceErrors>> = async (result) => updateServiceState(result)
