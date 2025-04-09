import type { Middleware, RouterContext } from '@koa/router'
import type Router from '@koa/router'
import type { Next } from 'koa'
import type Application from 'koa'
import type { Errors, Provider } from 'oidc-provider'
import { logger } from '../../logger'
import { invariant } from '../../util/invariant'

type Steps =
  | 'noCache'
  | 'sessionHandler'
  | 'deviceUserFlowErrors'
  | 'getResume'
  | 'deviceUserFlow'
  | 'parseBody'
  | 'authenticatedClientId'
  | 'paramsMiddleware'
  | 'rejectDupesMiddleware'
  | 'rejectUnsupported'
  | 'stripOutsideJarParams'
  | 'checkClient'
  | 'checkClientGrantType'
  | 'pushedAuthorizationRequestRemapErrors'
  | 'backchannelRequestRemapErrors'
  | 'fetchRequestUri'
  | 'processRequestObject'
  | 'checkResponseMode'
  | 'oneRedirectUriClients'
  | 'oauthRequired'
  | 'rejectRegistration'
  | 'checkResponseType'
  | 'oidcRequired'
  | 'cibaRequired'
  | 'assignDefaults'
  | 'checkPrompt'
  | 'checkScope'
  | 'checkOpenidScope'
  | 'checkRedirectUri'
  | 'checkPKCE'
  | 'checkClaims'
  | 'unsupportedRar'
  | 'checkRar'
  | 'checkResource'
  | 'checkMaxAge'
  | 'checkRequestedExpiry'
  | 'checkCibaContext'
  | 'checkIdTokenHint'
  | 'checkDpopJkt'
  | 'checkExtraParams'
  | 'interactionEmit'
  | 'assignClaims'
  | 'cibaLoadAccount'
  | 'loadAccount'
  | 'loadGrant'
  | 'interactions'
  | 'respond'
  | 'processResponseTypes'
  | 'deviceAuthorizationResponse'
  | 'deviceUserFlowResponse'
  | 'pushedAuthorizationRequestResponse'
  | 'backchannelRequestResponse'

type Verbs = 'HEAD' | 'OPTIONS' | 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE'
type Methods = '*' | Verbs[]

const buildContext = (provider: Provider) => {
  const app: Application = provider.app
  const dispatch = app.middleware.find((m) => m.name === 'dispatch')

  invariant(dispatch, 'Cannot hook to apply custom spec - Dispatch middleware not found.')
  invariant('router' in dispatch, 'Cannot hook to apply custom spec - Dispatch middleware does not have a router.')

  return { app, dispatch, router: dispatch.router as Router }
}

export const wrapOidcPipelineStep = (
  provider: Provider,
  action: 'authorization' | 'resume',
  methods: Methods,
  step: Steps,
  wrapper: (ctx: RouterContext, next: Next, original: Middleware) => Promise<void>,
) => {
  const { router } = buildContext(provider)

  const routes = router.stack.filter((r) => {
    if (r.opts.name !== action) return false
    return methods === '*' || r.methods.some((m) => methods.includes(m as Verbs))
  })

  invariant(routes.length > 0, `Cannot hook to apply custom spec - No routes found for action '${action}'.`)

  for (const route of routes) {
    const indexOfStep = route.stack.findIndex((m) => m.name === step || m.name === `bound ${step}`)
    const originalStep = route.stack[indexOfStep]

    invariant(originalStep, `Cannot hook to apply custom spec - Step '${step}' not found in route. Is it already wrapped?`)

    route.stack.splice(indexOfStep, 1, async (ctx, next) => {
      return await wrapper(ctx, next, originalStep)
    })
  }
}

export const paramsToAuthParamsSpec = (params: Record<string, unknown>, errors: Errors) => {
  const requiredString = (key: string) => {
    if (!params[key] || typeof params[key] !== 'string') {
      logger.error(`Missing required parameter: ${key}`)
      throw new errors.InvalidRequest(`Missing required parameter: ${key}`)
    }
    return params[key]
  }
  const optionalString = (key: string) => {
    return params[key] as string | undefined
  }
  return {
    scope: requiredString('scope'),
    response_type: requiredString('response_type'),
    client_id: requiredString('client_id'),
    redirect_uri: requiredString('redirect_uri'),
    state: optionalString('state'),
    response_mode: optionalString('response_mode'),
    nonce: optionalString('nonce'),
    display: optionalString('display'),
    prompt: optionalString('prompt'),
    max_age: optionalString('max_age'),
    ui_locales: optionalString('ui_locales'),
    id_token_hint: optionalString('id_token_hint'),
    login_hint: optionalString('login_hint'),
    acr_values: optionalString('acr_values'),
  }
}
