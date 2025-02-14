import type { ServiceState } from '.'
import { testServices, updateServiceState } from '.'
import type { JobHandler } from '../../background-jobs/jobs'
import { type JobType } from '../../background-jobs/queue'

export type MonitorServicesJobName = 'monitorServices'
export type MonitorServicesJobType = JobType<MonitorServicesJobName, undefined>

export const monitorServicesJobHandler: JobHandler<undefined, ServiceState> = testServices
export const monitorServicesResultHandler = updateServiceState
