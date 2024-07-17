import type { Config } from '../src/config'
import type { DeepPartial } from '../src/util/type-helpers'

const config: DeepPartial<Config> = {
  platformTenant: {
    tenantId: '3d804793-53dd-40a2-9d8a-9f67a92fd349',
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
  limitedApproval: {
    credentials: {
      clientId: '20b94470-7f92-46fd-b332-e5e9d06a04df',
    },
  },
  limitedPhotoCapture: {
    credentials: {
      clientId: '0d3d87e4-a50c-4a32-90d7-3d90670e39ee',
    },
  },
}

module.exports = config
