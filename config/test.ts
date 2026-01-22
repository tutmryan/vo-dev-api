import type { DeepPartial } from 'typeorm'
import type { Config } from '../src/config'

const config: DeepPartial<Config> = {
  instance: 'test',
  logging: {
    consoleOptions: {
      silent: true,
    },
  },
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
  privateBlobStorage: {
    clientEncryptionKey: 'TEST_PRIVATE_STORAGE_ENCRYPTION_KEY',
  },
  sms: {},
  email: {},
  homeTenant: {
    name: 'TEST_HOME_TENANT_NAME',
    tenantId: 'TEST_HOME_TENANT_ID',
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
  limitedApproval: {
    credentials: {},
  },
  limitedPhotoCapture: {
    credentials: {},
  },
  limitedAsyncIssuance: {
    credentials: {},
  },
  limitedDemo: {
    oid: 'TEST_LIMITED_DEMO_OID',
    credentials: {},
  },
  limitedOidcClient: {
    oid: 'TEST_LIMITED_OIDC_CLIENT_OID',
    credentials: {},
  },
  platformManagement: {
    remoteUrl: 'https://example.com/graphql',
  },
  mdoc: {
    presentationsEnabled: true,
    multipazTestCertificatesEnabled: true,
  },
}

module.exports = config
