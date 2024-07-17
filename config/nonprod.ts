import type { Config } from '../src/config'
import type { DeepPartial } from '../src/util/type-helpers'

const config: DeepPartial<Config> = {
  platformTenant: {
    tenantId: '5c14bb50-7602-4c0d-b785-5dee865e4665',
  },
  internalClient: {
    uri: 'api://verified-orchestration-internal-non-prod',
    credentials: {
      clientId: 'e39d4f8f-62c3-4549-9eec-94b785629967',
    },
  },
  callbackCredentials: {
    clientId: '2e2b9262-ec52-45da-95bb-4db42286ab52',
  },
  limitedAccess: {
    credentials: {
      clientId: '5869060c-373e-4eef-97de-967cfb2d6a92',
    },
  },
  limitedApproval: {
    credentials: {
      clientId: '49c96f72-4371-4d45-ba25-f30cf42694c5',
    },
  },
  limitedPhotoCapture: {
    credentials: {
      clientId: '07414b7d-4c42-4902-8661-a841270ef289',
    },
  },
}

module.exports = config
