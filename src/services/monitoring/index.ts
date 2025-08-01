import { testGraphService, testVidService } from '..'

export enum MonitoredServices {
  MSGraph = 'ms-graph',
  VerifiedID = 'verified-id',
}

export type ServiceErrors = Record<MonitoredServices, string | undefined>

export const serviceErrors: ServiceErrors = {
  [MonitoredServices.MSGraph]: undefined,
  [MonitoredServices.VerifiedID]: undefined,
}

export async function testServices(): Promise<ServiceErrors> {
  return {
    [MonitoredServices.MSGraph]: await testGraphService(),
    [MonitoredServices.VerifiedID]: await testVidService(),
  }
}

export function updateServiceState(newState: ServiceErrors): void {
  Object.assign(serviceErrors, newState)
}
