import type { OIDCContext } from 'oidc-provider'
import { type ApplyIntercept } from './integration-hook'

const getScopes = (oidc: OIDCContext) => {
  const scope = oidc.params?.scope
  return scope && typeof scope === 'string' ? [...new Set(scope.split(' '))] : []
}

export const applyCustomOfflineScopeHandling: ApplyIntercept = async (ctx, next, original) => {
  return await original(ctx, () => {
    const postStepScopes = getScopes(ctx.oidc)
    // Automatically include offline_access
    if (!postStepScopes.includes('offline_access')) {
      postStepScopes.push('offline_access')
      ctx.oidc.params!.scope = postStepScopes.join(' ')
    }
    return next()
  })
}
