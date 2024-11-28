import type { Constructor } from '@graphql-tools/utils'
import type { Express, RequestHandler } from 'express'
import { debounce } from 'lodash'
import type { Interaction, KoaContextWithOIDC, Provider, errors } from 'oidc-provider'
import { apiUrl, cookieSession } from '../../config'
import { logger } from '../../logger'
import { createRedisClient, isRedisEnabled } from '../../redis'
import { pubsub } from '../../redis/pubsub'
import { dynamicImport } from '../../util/dynamic-import'
import { invariant } from '../../util/invariant'
import { Lazy } from '../../util/lazy'
import { findAccount } from './account'
import { openidClaims, presentationLoginStandardClaims } from './claims'
import type { OidcData } from './data'
import { loadOidcData } from './data'
import { events } from './events'
import { extraParams } from './extra-params'
import { loadExistingGrant, useGrantedResource } from './grants'
import { keys } from './keys'
import { logEvents } from './log-events'
import RedisAdapter from './redis-adapter'
import { getResourceServerInfo } from './resource-indicators'
import { routes } from './routes'
import { logoutSource } from './source'
import { extraTokenClaims, issueRefreshToken } from './tokens'

export const oidcProviderModule = Lazy(async () => {
  const module = await dynamicImport<{ default: Constructor<Provider>; errors: typeof errors }>('oidc-provider')
  return { Provider: module.default, errors: module.errors }
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

  const [{ Provider }, jwksKeys, data] = await Promise.all([oidcProviderModule(), keys(), loadOidcData()])
  const { clients, clientMetadata, resources, resourceScopes } = data

  const provider = new Provider(issuer, {
    clients: clientMetadata,
    clientAuthMethods: ['none'],
    adapter: (name: string) => (isRedisEnabled ? new RedisAdapter(name, redisClient()) : undefined),
    cookies: {
      keys: [cookieSession.secret],
    },
    acrValues: [presentationLoginStandardClaims.acr],
    claims: { ...openidClaims, ...resourceScopes },
    conformIdTokenClaims: false,
    extraTokenClaims,
    issueRefreshToken,
    loadExistingGrant: loadExistingGrant(clients, resources),
    useGrantedResource,
    findAccount,
    features: {
      userinfo: { enabled: false },
      devInteractions: { enabled: false },
      rpInitiatedLogout: { logoutSource },
      resourceIndicators: {
        enabled: true,
        getResourceServerInfo: getResourceServerInfo(clients, resources),
      },
    },
    interactions: {
      url(_ctx: KoaContextWithOIDC, interaction: Interaction) {
        return `${oidcRoute}/interaction/${interaction.uid}`
      },
    },
    extraParams,
    jwks: { keys: jwksKeys },
  })

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
  events(provider)
  logEvents(provider)
  providerHandler = provider.callback()

  dataRef.provider = provider
  dataRef.data = data
}

let providerHandler: ReturnType<Provider['callback']> | undefined
const oidcRouteHandler: RequestHandler = async (req, res) => {
  if (!providerHandler) return res.sendStatus(503).end()
  return providerHandler(req, res)
}

export const dataRef: { provider?: Provider; data?: OidcData } = {}

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
