import type Provider from 'oidc-provider'
import type { OIDCContext } from 'oidc-provider'
import { logger } from '../../logger'
import { deleteAccount } from './account'

type Middleware = Parameters<Provider['use']>[0]
type Context = Parameters<Middleware>[0]

export const middleware: Middleware = async (ctx, next) => {
  // logger.verbose(`pre OIDC middleware: ${ctx.method} ${ctx.path}`)
  await next()

  const oidc = ctx.oidc as OIDCContext | undefined
  if (oidc) {
    deleteAccountOnLogout(ctx, oidc)
  } else {
    logger.warn(`No OIDC context found for ${ctx.method} ${ctx.path}`)
  }
  // logger.verbose(`post OIDC middleware: ${ctx.method} ${oidc?.route ?? 'unknown'}`)
}

function deleteAccountOnLogout(ctx: Context, oidc: OIDCContext) {
  if (oidc.route === 'end_session') {
    const accountId = oidc.entities.IdTokenHint?.payload.sub as string | undefined
    if (accountId) {
      logger.audit(`OIDC account ${accountId} logged out, deleting account`)
      deleteAccount(accountId).catch((error) => {
        logger.error(`Failed to delete OIDC account ${accountId}`, { error })
      })
    }
  }
}
