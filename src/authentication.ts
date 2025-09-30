import bearerTokenMiddleware from '@makerx/express-bearer'
import type { RequestHandler } from 'express'
import { decode } from 'jsonwebtoken'
import { JwksClient } from 'jwks-rsa'
import { authBearer, oidcIssuerOptions } from './config'
import { getAdAuthConfig } from './features/instance-configs'
import { logger } from './logger'
import { createGetKey, verifyToken } from './util/jwt'

const oidcBearerConfig = {
  ...authBearer,
  ...oidcIssuerOptions,
}

function customerTenantBearerTokenMiddleware(): RequestHandler {
  const jwksClient = new JwksClient({ jwksUri: 'https://login.microsoftonline.com/common/discovery/v2.0/keys' })
  const getKey = createGetKey(jwksClient)

  return async (req, res, next) => {
    if (req.user) return next()

    const authHeader = req.headers.authorization
    const token = authHeader && /^bearer /i.test(authHeader) ? authHeader.slice(7) : undefined

    if (!token) return next()

    const decoded = decode(token)
    if (!decoded || typeof decoded === 'string' || !decoded.iss || !decoded.aud) {
      return next()
    }

    const config = getAdAuthConfig(decoded)
    if (!config) return next()

    const { allowedIssuers, audience } = config
    const issuer = allowedIssuers.length === 1 ? allowedIssuers[0] : (allowedIssuers as [string, ...string[]])

    try {
      const verifiedJwtPayload = await verifyToken(token, getKey, {
        issuer,
        audience,
      })
      req.user = verifiedJwtPayload
      return next()
    } catch (error) {
      logger.error(`Failed to verify customer tenant token`, { error })
      return res.status(401).send('Unauthorized').end()
    }
  }
}

export function combinedBearerTokenMiddleware(): RequestHandler[] {
  // #1: Customer tenant auth (dynamic, hot-reloadable)
  const customerTenantAuth = customerTenantBearerTokenMiddleware()

  // #2: OIDC self-issued auth
  const oidcAuth = bearerTokenMiddleware({
    config: oidcBearerConfig,
    tokenIsRequired: false,
    logger,
  })

  // Only apply #2 if #1 did not authenticate
  const conditionalOidcAuth: RequestHandler = (req, res, next) => {
    if (req.user) next()
    else oidcAuth(req, res, next)
  }

  return [customerTenantAuth, conditionalOidcAuth]
}
