import type { Constructor } from '@graphql-tools/utils'
import { isLocalDev } from '@makerx/node-common'
import type { Express } from 'express'
import type { Interaction, KoaContextWithOIDC, Provider, errors } from 'oidc-provider'
import { apiUrl, cookieSession } from '../../config'
import { logger } from '../../logger'
import { createRedisClient, isRedisEnabled } from '../../redis'
import { dynamicImport } from '../../util/dynamic-import'
import { invariant } from '../../util/invariant'
import { Lazy } from '../../util/lazy'
import { findAccount } from './account'
import { claims } from './claims'
import { clients } from './clients'
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

export async function createProvider(route: string): Promise<Provider> {
  invariant(apiUrl, 'Config item apiUrl is not set')

  const issuer = `${apiUrl}${route}`
  logger.info(`Creating OIDC provider for: ${issuer}`)

  const { Provider } = await oidcProviderModule()

  const provider = new Provider(issuer, {
    clients,
    adapter: (name: string) => (isRedisEnabled ? new RedisAdapter(name, redisClient()) : undefined),
    cookies: {
      keys: [cookieSession.secret],
    },
    claims: await claims(),
    conformIdTokenClaims: false,
    extraTokenClaims,
    issueRefreshToken,
    loadExistingGrant,
    useGrantedResource,
    findAccount,
    features: {
      userinfo: { enabled: false },
      devInteractions: { enabled: false },
      rpInitiatedLogout: { logoutSource },
      resourceIndicators: {
        enabled: true,
        getResourceServerInfo,
      },
    },
    interactions: {
      url(_ctx: KoaContextWithOIDC, interaction: Interaction) {
        return `${route}/interaction/${interaction.uid}`
      },
    },
    extraParams,
    jwks: { keys: await keys() },
  })

  // https://github.com/panva/node-oidc-provider/blob/main/recipes/implicit_http_localhost.md#allowing-http-andor-localhost-for-implicit-response-type-web-clients
  // for localdev, allow HTTP and localhost
  if (isLocalDev) {
    // @ts-expect-error - private method
    const { invalidate: orig } = provider.Client.Schema.prototype
    // @ts-expect-error - private method
    provider.Client.Schema.prototype.invalidate = function invalidate(message, code) {
      if (code === 'implicit-force-https' || code === 'implicit-forbid-localhost') {
        return
      }
      orig.call(this, message)
    }
  }

  provider.proxy = true
  events(provider)
  logEvents(provider)
  return provider
}

export async function addOidcProvider(app: Express, route: string): Promise<void> {
  const provider = await createProvider(route)
  routes(app, route, provider)
  app.use(route, provider.callback())
}
