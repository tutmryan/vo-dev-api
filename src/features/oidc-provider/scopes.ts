import type { RouterContext } from '@koa/router'
import type { OIDCContext, Provider } from 'oidc-provider'
import { wrapOidcPipelineStep } from './integration-hook'

export const hookAndApplyCustomOfflineScopeHandling = (provider: Provider) => {
  // Override the authorization -> checkScope pipeline step to add back offline_access if it was removed
  wrapOidcPipelineStep(provider, 'authorization', '*', 'checkScope', async (ctx, next, original) => {
    const { oidc } = ctx as RouterContext & { oidc: OIDCContext }
    const getScopes = () => {
      const scope = oidc.params?.scope
      return scope && typeof scope === 'string' ? [...new Set(scope.split(' '))] : []
    }
    return await original(ctx, () => {
      const postStepScopes = getScopes()
      // Automatically include offline_access
      if (!postStepScopes.includes('offline_access')) {
        postStepScopes.push('offline_access')
        oidc.params!.scope = postStepScopes.join(' ')
      }
      return next()
    })
  })
}
