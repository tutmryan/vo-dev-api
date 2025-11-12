import type { JwtPayload } from 'jsonwebtoken'

describe('getAdAuthConfig', () => {
  const mockApiCredentials = {
    clientId: 'test-api-client-id',
  }

  const mockInternalClientIssuerOptions = {
    verifyOptions: {
      issuer: 'https://internal-issuer.com',
      audience: 'internal-audience',
    },
  }

  const mockHomeTenantId = 'home-tenant-123'
  const mockDbAuthEnabledTenantIds = ['tenant-456', 'tenant-789']

  type GetAdAuthConfig = typeof import('../index').getAdAuthConfig
  let getAdAuthConfig: GetAdAuthConfig

  beforeEach(async () => {
    // Mock the config module with all required dependencies
    jest.doMock('../../../config', () => ({
      apiCredentials: mockApiCredentials,
      internalClientIssuerOptions: mockInternalClientIssuerOptions,
      authBearer: {},
      homeTenant: { tenantId: mockHomeTenantId },
      platformTenant: { tenantId: 'test-platform-tenant' },
      auditLogStreaming: {
        dataCollectionEndpoint: 'https://test-endpoint.com',
        dataCollectionRuleId: 'test-rule-id',
        dataCollectionClientId: 'test-client-id',
        dataCollectionClientSecret: 'test-secret',
      },
      instance: 'test-instance',
      version: '1.0.0',
      database: {
        host: 'localhost',
        port: 5432,
        database: 'test-db',
        logging: false,
      },
      redis: {
        port: 6379,
        key: 'test-key',
      },
      blobStorage: {
        url: 'https://test-blob.com',
        logoImagesContainer: 'test-container',
      },
      privateBlobStorage: {
        url: 'https://test-private-blob.com',
        credentials: {
          sasToken: 'test-sas-token',
        },
        contractRequestsContainer: 'test-contract-container',
      },
      cookieSession: {
        name: 'test-session',
        secret: 'test-secret',
      },
      auth: {
        bearer: {},
        pkce: {
          credentials: {
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            authority: 'https://test-authority.com',
          },
          scopes: ['test-scope'],
          msalConfig: {
            auth: {
              clientId: 'test-client-id',
              authority: 'https://test-authority.com',
            },
          },
        },
        additionalAuthTenantIds: [],
      },
      events: {
        processingTimeoutSeconds: 30,
        pollingFrequencySeconds: 10,
        maxProcessingAttempts: 3,
      },
      devToolsEnabled: false,
      faceCheckEnabled: false,
      demoEnabled: false,
      oidcEnabled: false,
      authorityId: 'test-authority-id',
      email: {
        from: 'test@example.com',
        replyTo: 'test@example.com',
      },
      platformConsumerApps: [],
      rawCors: [],
      logging: {
        loggerOptions: {},
        consoleOptions: {},
        omitPaths: [],
        redactPaths: [],
      },
    }))

    // Import the module after mocking config
    const instanceConfigsModule = await import('../index')
    getAdAuthConfig = instanceConfigsModule.getAdAuthConfig

    // Mock the module-level variables by directly modifying the module
    instanceConfigsModule.dbAuthEnabledTenantIds.length = 0
    instanceConfigsModule.dbAuthEnabledTenantIds.push(...mockDbAuthEnabledTenantIds)
  })

  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('should return undefined when aud is missing', () => {
    const decoded = { iss: 'https://sts.windows.net/home-tenant-123/' } as JwtPayload
    const result = getAdAuthConfig(decoded)
    expect(result).toBeUndefined()
  })

  it('should return undefined when iss is missing', () => {
    const decoded = { aud: 'test-api-client-id' } as JwtPayload
    const result = getAdAuthConfig(decoded)
    expect(result).toBeUndefined()
  })

  it('should return undefined when audience is not valid', () => {
    const decoded = {
      aud: 'invalid-audience',
      iss: 'https://sts.windows.net/home-tenant-123/',
    } as JwtPayload
    const result = getAdAuthConfig(decoded)
    expect(result).toBeUndefined()
  })

  it('should return undefined when issuer is not valid', () => {
    const decoded = {
      aud: 'test-api-client-id',
      iss: 'https://invalid-issuer.com/',
    } as JwtPayload
    const result = getAdAuthConfig(decoded)
    expect(result).toBeUndefined()
  })

  it('should return config for valid API client audience and home tenant issuer', () => {
    const decoded = {
      aud: 'test-api-client-id',
      iss: 'https://sts.windows.net/home-tenant-123/',
    } as JwtPayload

    const result = getAdAuthConfig(decoded)

    expect(result).toEqual({
      allowedIssuers: [
        'https://sts.windows.net/home-tenant-123/',
        'https://sts.windows.net/tenant-456/',
        'https://sts.windows.net/tenant-789/',
        'https://internal-issuer.com',
      ],
      audience: 'test-api-client-id',
    })
  })

  it('should return config for valid api:// audience', () => {
    const decoded = {
      aud: 'api://test-api-client-id',
      iss: 'https://sts.windows.net/tenant-456/',
    } as JwtPayload

    const result = getAdAuthConfig(decoded)

    expect(result).toEqual({
      allowedIssuers: [
        'https://sts.windows.net/home-tenant-123/',
        'https://sts.windows.net/tenant-456/',
        'https://sts.windows.net/tenant-789/',
        'https://internal-issuer.com',
      ],
      audience: 'api://test-api-client-id',
    })
  })

  it('should return config for valid internal client audience and issuer', () => {
    const decoded = {
      aud: 'internal-audience',
      iss: 'https://internal-issuer.com',
    } as JwtPayload

    const result = getAdAuthConfig(decoded)

    expect(result).toEqual({
      allowedIssuers: [
        'https://sts.windows.net/home-tenant-123/',
        'https://sts.windows.net/tenant-456/',
        'https://sts.windows.net/tenant-789/',
        'https://internal-issuer.com',
      ],
      audience: 'internal-audience',
    })
  })

  it('should handle empty dbAuthEnabledTenantIds', async () => {
    // Override the dbAuthEnabledTenantIds for this test
    const instanceConfigsModule = await import('../index')
    instanceConfigsModule.dbAuthEnabledTenantIds.length = 0

    const decoded = {
      aud: 'test-api-client-id',
      iss: 'https://sts.windows.net/home-tenant-123/',
    } as JwtPayload

    const result = getAdAuthConfig(decoded)

    expect(result).toEqual({
      allowedIssuers: ['https://sts.windows.net/home-tenant-123/', 'https://internal-issuer.com'],
      audience: 'test-api-client-id',
    })
  })

  it('should deduplicate tenant IDs in allowed issuers', async () => {
    // Override the tenant IDs for this test
    const instanceConfigsModule = await import('../index')
    instanceConfigsModule.dbAuthEnabledTenantIds.length = 0
    instanceConfigsModule.dbAuthEnabledTenantIds.push('home-tenant-123', 'tenant-456')

    const decoded = {
      aud: 'test-api-client-id',
      iss: 'https://sts.windows.net/home-tenant-123/',
    } as JwtPayload

    const result = getAdAuthConfig(decoded)

    expect(result?.allowedIssuers).toEqual([
      'https://sts.windows.net/home-tenant-123/',
      'https://sts.windows.net/tenant-456/',
      'https://internal-issuer.com',
    ])
  })
})
