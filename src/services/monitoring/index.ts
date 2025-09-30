import { testAllGraphServices, testVidService } from '..'
import type { MsGraphFailure } from '../../generated/graphql'

export enum MonitoredServices {
  MSGraph = 'ms-graph',
  VerifiedID = 'verified-id',
}
export type ServiceErrors = {
  [MonitoredServices.MSGraph]: MsGraphFailure[] | undefined
  [MonitoredServices.VerifiedID]: string | undefined
}

export const serviceErrors: ServiceErrors = {
  [MonitoredServices.MSGraph]: undefined,
  [MonitoredServices.VerifiedID]: undefined,
}

export async function testServices(): Promise<ServiceErrors> {
  return {
    [MonitoredServices.MSGraph]: await testAllGraphServices(),
    [MonitoredServices.VerifiedID]: await testVidService(),
  }
}

export function updateServiceState(newState: Partial<ServiceErrors>): void {
  serviceErrors[MonitoredServices.MSGraph] = newState[MonitoredServices.MSGraph] ?? undefined
  serviceErrors[MonitoredServices.VerifiedID] = newState[MonitoredServices.VerifiedID] ?? undefined
}
