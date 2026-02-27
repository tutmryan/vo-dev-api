import type { Config } from '../src/config'
import type { DeepPartial } from '../src/util/type-helpers'

const config: DeepPartial<Config> = {
  sms: {
    sid: 'SK1b652ea9f03bd0cfd005c56d08224a5a',
  },
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
  limitedPresentationFlow: {
    credentials: {
      clientId: '20b94470-7f92-46fd-b332-e5e9d06a04df',
    },
  },
  limitedPhotoCapture: {
    credentials: {
      clientId: '0d3d87e4-a50c-4a32-90d7-3d90670e39ee',
    },
  },
  limitedAsyncIssuance: {
    credentials: {
      clientId: '8497a306-a749-44ae-acb9-ea723eefbc49',
    },
  },
  limitedDemo: {
    oid: '511c3c97-594e-459b-adc9-90f1d1df1d48',
    credentials: {
      clientId: '0a40ca72-b245-4ae2-8769-cd9e2695f102',
    },
  },
  limitedOidcClient: {
    oid: 'dd005fd6-1e8b-4844-9433-0ab277c1427b',
    credentials: {
      clientId: 'f3b8e4d5-6dc1-4949-8523-1f5180fa723e',
    },
  },
  platformManagement: {
    remoteUrl: 'https://management.api.verifiedorchestration.com/graphql',
  },
}

module.exports = config
