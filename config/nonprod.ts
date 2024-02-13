import type { Config } from '../src/config'
import type { DeepPartial } from '../src/util/type-helpers'

const config: DeepPartial<Config> = {
  cors: {
    origin: true,
    credentials: true,
  },
  auth: {
    pkce: { enabled: true },
  },
  platformTenant: {
    tenantId: '5c14bb50-7602-4c0d-b785-5dee865e4665',
    internalClientUri: 'api://verified-orchestration-internal-non-prod',
  },
  apiClient: {
    uri: 'api://verified-orchestration-non-prod',
    credentials: {
      clientId: 'c015d766-3423-4d30-8fbc-014191d27825',
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
}

module.exports = config
