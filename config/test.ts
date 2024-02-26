import type { DeepPartial } from 'typeorm'
import type { Config } from '../src/config'

const config: DeepPartial<Config> = {
  cors: {
    origin: true,
  },
  database: {
    database: 'VerifiedOrchestration_test',
    host: 'localhost',
    username: 'api_user',
    password: '7o}R~=XA1jmz!-aHQ^pA',
    logging: false,
  },
  // just enough config to support loadng of config under test
  authorityId: 'TEST_AUTHORITY_ID',
  server: {},
  auth: {
    bearer: {},
    pkce: {},
  },
  redis: {},
  homeTenant: {
    tenantId: 'TEST_HOME_TENANT_ID',
    graphCredentials: {},
    vidServiceCredentials: {},
  },
  platformTenant: {
    tenantId: 'TEST_PLATFORM_TENANT_ID',
  },
  apiClient: {
    credentials: {},
    uri: 'TEST_API_CLIENT_URI',
  },
  internalClient: {
    credentials: {},
    uri: 'TEST_INTERNAL_CLIENT_URI',
  },
  callbackCredentials: {},
  limitedAccess: {
    credentials: {},
  },
}

module.exports = config
