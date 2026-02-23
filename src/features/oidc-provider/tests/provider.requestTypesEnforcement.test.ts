import type { Middleware } from '@koa/router'
import type { Next, Request } from 'koa'
import type { ClientMetadata, Provider } from 'oidc-provider'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import { applyOIDCProviderHooks, enforceAllowedAuthorisationRequestTypesPerClient, type RouterContextWithOIDC } from '../integration-hook'
import { getClient, oidcProviderModule } from '../provider'

jest.mock('../provider', () => ({
  getClient: jest.fn(),
  oidcProviderModule: jest.fn(),
}))

const mockedGetClient = getClient as jest.MockedFunction<typeof getClient>
const mockedOidcProviderModule = oidcProviderModule as jest.MockedFunction<typeof oidcProviderModule>

describe('per-client request object enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('throws RequestNotSupported when request objects are disabled for the client', async () => {
    let originalCalled = false
    const original: Middleware = async function processRequestObject(ctx: RouterContextWithOIDC, next: Next) {
      originalCalled = true
      await next()
    } as Middleware

    const mockRequest = {
      headers: {},
      get: jest.fn().mockReturnValue(''),
      header: jest.fn().mockReturnValue(''),
      url: '/auth',
      connection: { remoteAddress: '127.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request

    mockedGetClient.mockReturnValue({ authorizationRequestsTypeJarEnabled: false } as unknown as OidcClientEntity)

    class TestRequestNotSupported extends Error {
      error = 'request_not_supported'
      statusCode = 400
      error_description: string

      constructor(description?: string) {
        super(description)
        this.error_description = description ?? ''
      }
    }

    mockedOidcProviderModule.mockResolvedValue({
      errors: { RequestNotSupported: TestRequestNotSupported },
    } as unknown as Awaited<ReturnType<typeof oidcProviderModule>>)

    const ctx: RouterContextWithOIDC = {
      request: mockRequest,
      oidc: {
        client: { clientId: 'client-1' } as unknown as ClientMetadata,
        params: { request: 'jwt' } as unknown as Record<string, unknown>,
      },
    } as unknown as RouterContextWithOIDC

    await expect(
      enforceAllowedAuthorisationRequestTypesPerClient(ctx, (async () => {}) as Next, original as Middleware),
    ).rejects.toMatchObject({
      error: 'request_not_supported',
      statusCode: 400,
      error_description: 'Request objects are disabled for this client',
    })

    expect(originalCalled).toBe(false)
    expect(mockedGetClient).toHaveBeenCalledWith('client-1')
  })

  it('allows request objects when enabled for the client', async () => {
    let originalCalled = false
    const original: Middleware = async function processRequestObject(ctx: RouterContextWithOIDC, next: Next) {
      originalCalled = true
      await next()
    } as Middleware

    mockedGetClient.mockReturnValue({ authorizationRequestsTypeJarEnabled: true } as unknown as OidcClientEntity)

    const ctx: RouterContextWithOIDC = {
      request: { headers: {}, get: jest.fn(), url: '/auth' },
      oidc: {
        client: { clientId: 'client-1' } as unknown as ClientMetadata,
        params: { request: 'jwt' } as unknown as Record<string, unknown>,
      },
    } as unknown as RouterContextWithOIDC

    await enforceAllowedAuthorisationRequestTypesPerClient(ctx, (async () => {}) as Next, original as Middleware)

    expect(originalCalled).toBe(true)
  })

  it('passes through when no request object is present and plain request is checked', async () => {
    let originalCalled = false
    const original: Middleware = async function processRequestObject(ctx: RouterContextWithOIDC, next: Next) {
      originalCalled = true
      await next()
    } as Middleware

    mockedGetClient.mockReturnValue({ authorizationRequestsTypeStandardEnabled: true } as unknown as OidcClientEntity)

    const ctx: RouterContextWithOIDC = {
      request: { headers: {}, get: jest.fn(), url: '/auth' },
      oidc: {
        client: { clientId: 'client-1' } as unknown as ClientMetadata,
        params: {} as unknown as Record<string, unknown>,
      },
    } as unknown as RouterContextWithOIDC

    await enforceAllowedAuthorisationRequestTypesPerClient(ctx, (async () => {}) as Next, original as Middleware)

    expect(originalCalled).toBe(true)
    expect(mockedGetClient).toHaveBeenCalledWith('client-1')
  })

  it('throws RequestNotSupported when plain request objects are disabled for the client', async () => {
    let originalCalled = false
    const original: Middleware = async function processRequestObject(ctx: RouterContextWithOIDC, next: Next) {
      originalCalled = true
      await next()
    } as Middleware

    mockedGetClient.mockReturnValue({ authorizationRequestsTypeStandardEnabled: false } as unknown as OidcClientEntity)

    class TestRequestNotSupported extends Error {
      error = 'request_not_supported'
      statusCode = 400
      error_description: string

      constructor(description?: string) {
        super(description)
        this.error_description = description ?? ''
      }
    }

    mockedOidcProviderModule.mockResolvedValue({
      errors: { RequestNotSupported: TestRequestNotSupported },
    } as unknown as Awaited<ReturnType<typeof oidcProviderModule>>)

    const mockRequest = {
      headers: {},
      get: jest.fn().mockReturnValue(''),
      header: jest.fn().mockReturnValue(''),
      url: '/auth',
      connection: { remoteAddress: '127.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request

    const ctx: RouterContextWithOIDC = {
      request: mockRequest,
      oidc: {
        client: { clientId: 'client-1' } as unknown as ClientMetadata,
        params: {} as unknown as Record<string, unknown>,
      },
    } as unknown as RouterContextWithOIDC

    await expect(
      enforceAllowedAuthorisationRequestTypesPerClient(ctx, (async () => {}) as Next, original as Middleware),
    ).rejects.toMatchObject({
      error: 'request_not_supported',
      statusCode: 400,
      error_description: 'Standard authorization requests are disabled for this client',
    })

    expect(originalCalled).toBe(false)
    expect(mockedGetClient).toHaveBeenCalledWith('client-1')
  })

  it('wires enforceAllowedAuthorisationRequestTypesPerClient into the processRequestObject step', async () => {
    const checkIdTokenHint: Middleware = async function checkIdTokenHint(ctx, next) {
      await next()
    }

    const interactions: Middleware = async function interactions(ctx, next) {
      await next()
    }

    const processRequestObject: Middleware = async function processRequestObject(ctx, next) {
      await next()
    }

    const checkScope: Middleware = async function checkScope(ctx, next) {
      await next()
    }

    const route = {
      opts: { name: 'authorization' },
      methods: ['GET', 'POST'],
      stack: [checkIdTokenHint, interactions, processRequestObject, checkScope],
    }

    const router = { stack: [route] }
    const dispatch = { name: 'dispatch', router }
    const provider: Provider = { middleware: [dispatch] } as unknown as Provider

    const processIndex = route.stack.findIndex((m) => m === processRequestObject)
    const originalProcess = route.stack[processIndex]

    applyOIDCProviderHooks(provider)

    const wrapped = route.stack[processIndex]

    expect(wrapped).not.toBe(originalProcess)

    // Verify the wrapped middleware calls through to enforceAllowedAuthorisationRequestTypesPerClient
    // by invoking it and confirming it completes (with no client, it passes through to next)
    const mockRequest = {
      headers: {},
      get: jest.fn().mockReturnValue(''),
      header: jest.fn().mockReturnValue(''),
      url: '/auth',
      connection: { remoteAddress: '127.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request

    const ctx: RouterContextWithOIDC = {
      request: mockRequest,
      oidc: {
        client: undefined,
        params: {} as unknown as Record<string, unknown>,
      },
    } as unknown as RouterContextWithOIDC

    const nextFn = jest.fn()
    await (wrapped as Middleware)(ctx, nextFn as unknown as Next)

    expect(nextFn).toHaveBeenCalledTimes(1)
  })
})
