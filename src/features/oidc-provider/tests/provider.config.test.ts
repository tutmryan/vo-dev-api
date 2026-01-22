import type { Express } from 'express'
import type { JWK } from 'jose'
import type { AccessToken, Configuration, KoaContextWithOIDC } from 'oidc-provider'

const TEST_COOKIE_SECRET = 'test-secret'
const TEST_SUPPORTED_ACRS = ['loa1', 'loa2'] as const
const TEST_EXTRA_PARAMS = { extra_param: true } as const
const TEST_EAM_EXTRA_PARAMS = { eam_param: true } as const
const TEST_JWKS_KEYS = [{ kid: '1', kty: 'RSA' }] as unknown as JWK[]

const createApp = (): Express =>
  ({
    use: jest.fn(),
  }) as unknown as Express

const capturedConfigs: Configuration[] = []

//#region Mocks

jest.mock('@/logger', () => ({
  LoggerForTypeOrm: jest.fn().mockImplementation(() => ({})),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

jest.mock('@/util/dynamic-import', () => {
  // Mock the dynamic import used by oidcProviderModule to return our fake Provider
  const Provider = jest.fn((_issuer: string, config: Configuration) => {
    capturedConfigs.push(config)
    return {
      callback: () => jest.fn(),
      Client: {
        Schema: {
          prototype: {
            invalidate: jest.fn(),
          },
        },
      },
      use: jest.fn(),
    }
  })

  return {
    __esModule: true,
    dynamicImport: jest.fn(async () => ({
      default: Provider,
      errors: {},
      interactionPolicy: {},
    })),
  }
})

jest.mock('@/features/oidc-provider/keys', () => ({
  keys: jest.fn(async () => TEST_JWKS_KEYS),
}))

jest.mock('@/features/oidc-provider/data', () => ({
  loadOidcData: jest.fn(async () => ({
    clients: [],
    clientMetadata: [],
    resources: [],
    resourceScopes: {},
    partners: [],
    mappedClaims: {},
  })),
}))

jest.mock('@/config', () => ({
  apiUrl: 'https://api.example.com',
  cookieSession: { secret: TEST_COOKIE_SECRET },
}))

jest.mock('@/redis', () => ({
  createRedisClient: jest.fn(),
  isRedisEnabled: false,
}))

jest.mock('@/features/oidc-provider/integration-hook', () => ({
  applyOIDCProviderHooks: jest.fn(),
}))

jest.mock('@/features/oidc-provider/integrations/entra-eam', () => ({
  eamExtraParams: TEST_EAM_EXTRA_PARAMS,
  registerEamEventListeners: jest.fn(),
}))

jest.mock('@/features/oidc-provider/log-events', () => ({
  logEvents: jest.fn(),
}))

jest.mock('@/features/oidc-provider/middleware', () => ({
  middleware: jest.fn(),
}))

jest.mock('@/features/oidc-provider/routes', () => ({
  routes: jest.fn(),
}))

jest.mock('@/features/oidc-provider/extra-params', () => ({
  extraParams: TEST_EXTRA_PARAMS,
}))

jest.mock('@/features/oidc-provider/tokens', () => ({
  extraTokenClaims: jest.fn(),
  issueRefreshToken: jest.fn(),
}))

jest.mock('@/features/oidc-provider/resource-indicators', () => ({
  getResourceServerInfo: jest.fn(() => jest.fn()),
}))

jest.mock('@/features/oidc-provider/claims-parameter', () => ({
  assertClaimsParameter: jest.fn(),
}))

jest.mock('@/features/oidc-provider/claims', () => ({
  openidClaims: {},
  supportedAcrs: [...TEST_SUPPORTED_ACRS],
}))

jest.mock('@/features/oidc-provider/error-handler', () => ({
  errorHandler: jest.fn(),
}))

jest.mock('@/redis/pubsub', () => ({
  pubsub: jest.fn(() => ({ subscribe: jest.fn(), publish: jest.fn() })),
}))

jest.mock('@/features/oidc-provider/source', () => ({
  logoutSource: jest.fn(),
}))

//#endregion

describe('createProvider configuration', () => {
  it('configures provider with expected settings', async () => {
    const { addOidcProvider } = await import('../provider')

    const app = createApp()
    await addOidcProvider(app)

    expect(capturedConfigs.length).toBe(1)
    const config = capturedConfigs[0]!

    expect(config.clientAuthMethods).toEqual(['none', 'client_secret_post'])

    expect(config.cookies?.keys).toEqual([TEST_COOKIE_SECRET])
    expect(config.cookies?.long?.sameSite).toBe('none')
    expect(config.cookies?.long?.secure).toBe(true)

    expect(config.acrValues).toEqual(TEST_SUPPORTED_ACRS)
    expect(config.conformIdTokenClaims).toBe(false)

    expect(config.features?.userinfo?.enabled).toBe(false)
    expect(config.features?.devInteractions?.enabled).toBe(false)

    expect(config.features?.rpInitiatedLogout?.logoutSource).toBeDefined()

    expect(config.features?.resourceIndicators?.enabled).toBe(true)
    expect(config.features?.resourceIndicators?.getResourceServerInfo).toBeDefined()

    expect(config.features?.claimsParameter?.enabled).toBe(true)
    expect(config.features?.claimsParameter?.assertClaimsParameter).toBeDefined()

    expect(config.features?.requestObjects?.enabled).toBe(true)
    expect(config.features?.requestObjects?.requireSignedRequestObject).toBe(false)

    expect(config.extraParams).toMatchObject({ ...TEST_EXTRA_PARAMS, ...TEST_EAM_EXTRA_PARAMS })

    expect(config.jwks?.keys).toEqual(TEST_JWKS_KEYS)

    expect(config.expiresWithSession?.(undefined as unknown as KoaContextWithOIDC, undefined as unknown as AccessToken)).toBe(false)
    expect(config.ttl?.Session).toBe(1)

    expect(config.enableHttpPostMethods).toBe(true)

    const expectedRequestObjectSigningAlgValues = [
      'HS256',
      'HS384',
      'HS512',
      'RS256',
      'RS384',
      'RS512',
      'PS256',
      'PS384',
      'PS512',
      'ES256',
      'ES384',
      'ES512',
      'Ed25519',
      'EdDSA',
    ]
    expect(config.enabledJWA?.requestObjectSigningAlgValues).toHaveLength(expectedRequestObjectSigningAlgValues.length)
    expect(config.enabledJWA?.requestObjectSigningAlgValues).toEqual(expect.arrayContaining(expectedRequestObjectSigningAlgValues))
  })
})
