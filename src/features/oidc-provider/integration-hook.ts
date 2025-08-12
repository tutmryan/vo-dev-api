import type Router from '@koa/router'
import type { Middleware, RouterContext } from '@koa/router'
import type { Next } from 'koa'
import type { OIDCContext, Provider } from 'oidc-provider'
import { invariant } from '../../util/invariant'
import {
  applyEamCheckIdTokenHook,
  applyEamInteractionsHook,
  isEamCheckIdTokenIntercept,
  isEamInteractionsIntercept,
} from './integrations/entra-eam'
import { applyPopulateInteractiveLoginDataHook } from './populate-interactive-login-data'
import { applyCustomOfflineScopeHandling } from './scopes'

export type RouterContextWithOIDC = RouterContext & { oidc: OIDCContext }
export type InterceptCheck = (ctx: RouterContextWithOIDC, next: Next, original: Middleware) => Promise<boolean>
export type ApplyIntercept = (ctx: RouterContextWithOIDC, next: Next, original: Middleware) => Promise<void>
export type ApplyPostIntercept = (ctx: RouterContextWithOIDC) => Promise<void>

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
  | 'deviceAuthorizationResponse'
  | 'deviceUserFlowResponse'
  | 'pushedAuthorizationRequestResponse'
  | 'backchannelRequestResponse'

type Verbs = 'HEAD' | 'OPTIONS' | 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE'
type Methods = '*' | Verbs[]

const buildContext = (provider: Provider) => {
  const dispatch = provider.middleware.find((m) => m.name === 'dispatch')
  invariant(dispatch, 'Cannot hook to apply custom spec - Dispatch middleware not found.')
  invariant('router' in dispatch, 'Cannot hook to apply custom spec - Dispatch middleware does not have a router.')
  return { dispatch, router: dispatch.router as Router }
}

const wrapOidcPipelineStep = (
  provider: Provider,
  action: 'authorization' | 'resume',
  methods: Methods,
  step: Steps,
  wrapper: (ctx: RouterContextWithOIDC, next: Next, original: Middleware) => Promise<void>,
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
      return await wrapper(ctx as RouterContextWithOIDC, next, originalStep)
    })
  }
}

/**
 * Applies all OIDC provider hooks to the given provider instance.
 *
 * This function provides centralised control over OIDC provider hooks and their order of execution.
 * We use wrapOidcPipelineStep only for steps that need to be wrapped, and apply the hooks directly
 * in the wrapper function to avoid conflicts when hooking the same step multiple times.
 *
 * @param provider - The OIDC provider instance to apply hooks to
 *
 * @remarks
 * We don't use wrapOidcPipelineStep everywhere because hooking the same step multiple times
 * doesn't play nice and is harder to understand.
 *
 * @note Due to Node.js events not being async-friendly, we cannot use events for things that
 * require linear execution in the OIDC pipeline. Additionally, events won't allow us to override
 * the original step, which is required for some hooks (e.g., the isEamCheckIdTokenIntercept EAM hook).
 */
export const applyOIDCProviderHooks = (provider: Provider) => {
  wrapOidcPipelineStep(provider, 'authorization', '*', 'checkIdTokenHint', async (ctx, next, original) => {
    if (await isEamCheckIdTokenIntercept(ctx)) {
      return await applyEamCheckIdTokenHook(ctx, next, original)
    }

    return await original(ctx, next)
  })

  wrapOidcPipelineStep(provider, 'authorization', '*', 'interactions', async (ctx, next, original) => {
    // This intercept is a special case, because the provider doesn't call next if the interaction is starting
    // and mostly likely, we're interested in doing stuff after the interaction is started but before the response is sent.
    // So we call the original step, then apply the post step hooks.
    await original(ctx, next)

    // Post step hooks
    await applyPopulateInteractiveLoginDataHook(ctx)

    if (await isEamInteractionsIntercept(ctx)) {
      return await applyEamInteractionsHook(ctx)
    }
  })

  wrapOidcPipelineStep(provider, 'authorization', '*', 'checkScope', async (ctx, next, original) => {
    return applyCustomOfflineScopeHandling(ctx, next, original)
  })
}
