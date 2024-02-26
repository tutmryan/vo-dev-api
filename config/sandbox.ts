import type { Config } from '../src/config'
import type { DeepPartial } from '../src/util/type-helpers'

const config: DeepPartial<Config> = {
  platformTenant: {
    tenantId: '3d804793-53dd-40a2-9d8a-9f67a92fd349',
  },
  apiClient: {
    uri: 'api://verified-orchestration-sandbox',
    credentials: {
      clientId: 'bbe9101e-a8f2-47f4-95d1-059d3834b910',
    },
  },
  internalClient: {
    uri: 'api://verified-orchestration-internal',
    credentials: {
      clientId: '527e0466-d47b-41ef-8c0a-db9a317eb77f',
    },
  },
  callbackCredentials: {
    clientId: 'f437f4fa-25c5-493a-a23c-c92adf42e082',
  },
  limitedAccess: {
    credentials: {
      clientId: '137d81ce-2067-4670-9c61-70bb7fc726e8',
    },
  },
}

module.exports = config
