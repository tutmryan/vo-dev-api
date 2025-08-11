import type { ServiceErrors } from '.'
import { testServices, updateServiceState } from '.'
import type { JobResultHandler } from '../../background-jobs/jobs'

export const monitorServicesJobHandler = testServices
export const monitorServicesResultHandler: JobResultHandler<Partial<ServiceErrors>> = async (result) => {
  updateServiceState(result)
}
