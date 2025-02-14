import { testGraphService, testVidService } from '..'

export type ServiceState = {
  ['ms-graph']: boolean | undefined
  ['verified-id']: boolean | undefined
}

export const serviceState: ServiceState = {
  'ms-graph': undefined,
  'verified-id': undefined,
}

export async function testServices(): Promise<ServiceState> {
  return {
    'ms-graph': await testGraphService(),
    'verified-id': await testVidService(),
  }
}

export function updateServiceState(newState: ServiceState): void {
  Object.assign(serviceState, newState)
}
