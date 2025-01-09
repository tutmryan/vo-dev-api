import type Provider from 'oidc-provider'
import type { OIDCContext } from 'oidc-provider'
import { logger } from '../../logger'
import { sessionCookieName } from './session'

type Middleware = Parameters<Provider['use']>[0]

export const middleware: Middleware = async (ctx, next) => {
  // logger.verbose(`pre OIDC middleware: ${ctx.method} ${ctx.path}`)
  await next()

  const oidc = ctx.oidc as OIDCContext | undefined
  if (oidc) {
    enforceTransientBrowserSession(ctx, oidc)
  } else {
    logger.warn(`No OIDC context found for ${ctx.method} ${ctx.path}`)
  }
  // logger.verbose(`post OIDC middleware: ${ctx.method} ${oidc?.route ?? 'unknown'}`)
}

function enforceTransientBrowserSession(ctx: Parameters<Middleware>[0], oidc: OIDCContext) {
  if (oidc.route === 'resume' && oidc.params?.code_challenge) {
    if (ctx.response.headerSent) throw new Error('Response headers already sent, so the auth flow browser session cannot be cleared')

    ctx.cookies.set(sessionCookieName, undefined, { maxAge: 0, overwrite: true })
    ctx.cookies.set(`${sessionCookieName}.legacy`, undefined, { maxAge: 0, overwrite: true })
  }
}
