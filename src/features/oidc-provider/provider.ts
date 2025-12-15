import { type Constructor } from '@graphql-tools/utils'
import type { Express, RequestHandler } from 'express'
import type { JWK } from 'jose'
import { debounce } from 'lodash'
import type { Configuration, Errors, Interaction, interactionPolicy, KoaContextWithOIDC, Provider } from 'oidc-provider'
import { apiUrl, cookieSession } from '../../config'
import { logger } from '../../logger'
import { createRedisClient, isRedisEnabled } from '../../redis'
import { pubsub } from '../../redis/pubsub'
import { dynamicImport } from '../../util/dynamic-import'
import { invariant } from '../../util/invariant'
import { Lazy } from '../../util/lazy'
import { mergeWithArrays } from '../../util/merge'
import { throwError } from '../../util/throw-error'
import { findAccount } from './account'
import { openidClaims, supportedAcrs } from './claims'
import { assertClaimsParameter } from './claims-parameter'
import type { OidcData } from './data'
import { loadOidcData } from './data'
import { errorHandler } from './error-handler'
import { extraParams } from './extra-params'
import { loadExistingGrant } from './grants'
import { applyOIDCProviderHooks } from './integration-hook'
import { eamExtraParams, registerEamEventListeners } from './integrations/entra-eam'
import { keys } from './keys'
import { logEvents } from './log-events'
import { middleware } from './middleware'
import RedisAdapter from './redis-adapter'
import { getResourceServerInfo } from './resource-indicators'
import { routes } from './routes'
import { logoutSource } from './source'
import { extraTokenClaims, issueRefreshToken } from './tokens'

export const oidcProviderModule = Lazy(async () => {
  const module = await dynamicImport<{ default: Constructor<Provider>; errors: Errors; interactionPolicy: interactionPolicy }>(
    'oidc-provider',
  )
  return { Provider: module.default, errors: module.errors, interactionPolicy: module.interactionPolicy }
})

const redisClient = Lazy(() => createRedisClient('oidc'))

const oidcRoute = '/oidc'
const OIDC_DATA_CHANGED_TOPIC = 'OIDC_DATA_CHANGED'

/**
 * Creates the OIDC provider and assigns it to the providerRef.
 */
async function createProvider() {
  invariant(apiUrl, 'Config item apiUrl is not set')

  const issuer = `${apiUrl}${oidcRoute}`
  logger.info(`Creating OIDC provider for: ${issuer}`)

  const { Provider } = await oidcProviderModule()

  // Load JWKS keys and OIDC data in parallel, but don't fail fast
  const [jwksKeysPromise, dataPromise] = await Promise.allSettled([keys(), loadOidcData()])

  if (jwksKeysPromise.status === 'rejected') throw jwksKeysPromise.reason
  const jwksKeys = jwksKeysPromise.value

  if (dataPromise.status === 'rejected') throw dataPromise.reason
  const data = { ...dataPromise.value, keys: jwksKeys }

  const { clients, clientMetadata, resources, resourceScopes, mappedClaims } = data

  const claims = mergeWithArrays(openidClaims, resourceScopes, mappedClaims)

  const provider = new Provider(issuer, {
    clients: clientMetadata,
    clientAuthMethods: ['none', 'client_secret_post'],
    ...(isRedisEnabled ? { adapter: (name) => new RedisAdapter(name, redisClient()) } : {}),
    cookies: {
      keys: [cookieSession.secret ?? throwError('cookieSession.secret is required')],
      long: {
        sameSite: 'none', // The default is `lax`, but cookies are sent with the POST verb, so we need to set it to `none`
        secure: true, // Cookies are sent over HTTPS only
      },
    },
    acrValues: [...supportedAcrs],
    claims,
    conformIdTokenClaims: false,
    extraTokenClaims,
    issueRefreshToken,
    loadExistingGrant: loadExistingGrant(clients, resources),
    findAccount,
    features: {
      userinfo: { enabled: false },
      devInteractions: { enabled: false },
      rpInitiatedLogout: { logoutSource },
      resourceIndicators: {
        enabled: true,
        getResourceServerInfo: getResourceServerInfo(clients, resources),
      },
      claimsParameter: {
        enabled: true,
        assertClaimsParameter,
      },
      requestObjects: {
        enabled: true,
        requireSignedRequestObject: false,
      },
    },
    interactions: {
      url(_ctx: KoaContextWithOIDC, interaction: Interaction) {
        return `${oidcRoute}/interaction/${interaction.uid}`
      },
    },
    extraParams: { ...extraParams, ...eamExtraParams },
    jwks: { keys: jwksKeys },
    // Expire browser sessions immediately, since each credential provides a distinct account / subject identifier / session
    expiresWithSession: () => false,
    ttl: {
      Session: 1,
    },
    renderError: errorHandler,
    enableHttpPostMethods: true,
  } satisfies Configuration)

  // allow http + localhost for redirect URIs
  // as per: https://github.com/panva/node-oidc-provider/blob/main/recipes/implicit_http_localhost.md#allowing-http-andor-localhost-for-implicit-response-type-web-clients
  // we allow http + localhost, but only together, otherwise require https and forbid localhost
  // however validation of client redirect URIs is controlled at the API layer - this override point doesn't support validating the entire URI
  // @ts-expect-error - private method
  const { invalidate: orig } = provider.Client.Schema.prototype
  // @ts-expect-error - private method
  provider.Client.Schema.prototype.invalidate = function invalidate(message, code) {
    if (code === 'implicit-force-https' || code === 'implicit-forbid-localhost') {
      return
    }
    orig.call(this, message)
  }

  provider.proxy = true
  logEvents(provider)
  provider.use(middleware)
  // Integrations & Customisations
  applyOIDCProviderHooks(provider)
  registerEamEventListeners(provider)

  // Post set up
  providerHandler = provider.callback()
  dataRef.provider = provider
  dataRef.data = data
}

let providerHandler: ReturnType<Provider['callback']> | undefined
const oidcRouteHandler: RequestHandler = async (req, res) => {
  if (!providerHandler) {
    logger.error('OIDC provider not set')
    return res.sendStatus(503).end()
  }
  return providerHandler(req, res)
}

const dataRef: { provider?: Provider; data?: OidcData & { keys: JWK[] } } = {}

export function getProvider() {
  const provider = dataRef.provider
  invariant(provider, 'dataRef.provider not set')
  return provider
}

export const hasData = () => !!dataRef.data

export function getData() {
  const data = dataRef.data
  invariant(data, 'dataRef.data not set')
  return data
}

export function getClient(clientId: string) {
  const client = getData().clients.find((c) => c.id === clientId)
  invariant(client, 'client not found')
  return client
}

export async function addOidcProvider(app: Express): Promise<string> {
  await createProvider()
  routes(app, oidcRoute)
  app.use(oidcRoute, oidcRouteHandler)
  subscribeToOidcDataChanges()
  return oidcRoute
}

function subscribeToOidcDataChanges() {
  pubsub().subscribe(OIDC_DATA_CHANGED_TOPIC, async () => {
    logger.info('OIDC data changed, reloading provider')
    createProvider().catch((error) => logger.error('Error reloading OIDC provider', { error }))
  })
}

export const notifyOidcDataChanged = debounce(() => pubsub().publish(OIDC_DATA_CHANGED_TOPIC, {}), 1000)
