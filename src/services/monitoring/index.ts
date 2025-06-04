import { testGraphService, testVidService } from '..'

export const monitoredServices = {
  MSGraph: 'ms-graph',
  VerifiedID: 'verified-id',
} as const

type MonitoredService = (typeof monitoredServices)[keyof typeof monitoredServices]
export type ServiceState = Record<MonitoredService, boolean>

// Default to successful (true) to avoid false positives on startup
const serviceStatuses: ServiceState = {
  [monitoredServices.MSGraph]: true,
  [monitoredServices.VerifiedID]: true,
}

export function getServiceStatus(service: MonitoredService): boolean {
  return serviceStatuses[service]
}

export async function testServices(): Promise<ServiceState> {
  return {
    [monitoredServices.MSGraph]: await testGraphService(),
    [monitoredServices.VerifiedID]: await testVidService(),
  }
}

export function updateServiceState(newState: ServiceState): void {
  Object.assign(serviceStatuses, newState)
}
