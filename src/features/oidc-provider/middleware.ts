import type Provider from 'oidc-provider'
import { logger } from '../../logger'

/**
 * Useful to switch on via provider.use(middleware) to debug the OIDC flow during development
 */
export const middleware: Parameters<Provider['use']>[0] = async (ctx, next) => {
  logger.verbose(`pre OIDC middleware: ${ctx.method} ${ctx.path}`)
  await next()
  logger.verbose(`post OIDC middleware: ${ctx.method} ${ctx.oidc.route}`)
}
