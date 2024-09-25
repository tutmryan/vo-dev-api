import type { JwtPayload, RequestInfo } from '@makerx/graphql-core'
import type { NextFunction, Request, Response } from 'express'
import { GraphQLError } from 'graphql'
import type { RateLimiterAbstract, RateLimiterRes } from 'rate-limiter-flexible'
import { BurstyRateLimiter } from 'rate-limiter-flexible'
import type { GraphQLContext } from './context'
import { logger } from './logger'
import { rateLimiter } from './redis'
import { invariant } from './util/invariant'

const baseRateLimiter = rateLimiter({
  points: 10,
  duration: 1,
  inMemoryBlockOnConsumed: 10,
  keyPrefix: 'rate-limit-base',
})

const burstRateLimiter = rateLimiter({
  points: 100,
  duration: 5,
  keyPrefix: 'rate-limit-burst',
  inMemoryBlockOnConsumed: 100,
})

const burstyLimiter = new BurstyRateLimiter(baseRateLimiter, burstRateLimiter)

function buildRateLimitErrorLogMetadata(error: any | RateLimiterRes) {
  let logMeta: any = { error }
  if ('msBeforeNext' in error) {
    const { consumedPoints, remainingPoints, msBeforeNext } = error
    logMeta = { consumedPoints, remainingPoints, msBeforeNext }
  }
  return logMeta
}

export const consumeRateLimit = async (
  limiter: RateLimiterAbstract,
  key: string | GraphQLContext,
  requestInfo?: RequestInfo,
  errorMessage = 'Rate limit exceeded',
) => {
  try {
    await limiter.consume(typeof key === 'string' ? key : rateLimiterRequestKey(key.user?.claims, key.requestInfo.clientIp))
  } catch (error: unknown | RateLimiterRes) {
    const logMeta = { requestInfo, ...buildRateLimitErrorLogMetadata(error) }
    logger.warn(`Rate limit exceeded on limiter: ${limiter.keyPrefix} for key: ${key}`, logMeta)
    throw new GraphQLError(errorMessage, {
      extensions: { code: 'TOO_MANY_REQUESTS', http: { status: 429 } },
    })
  }
}

function clientIp(req: Request) {
  const address = req.ip ?? req.socket.remoteAddress
  if (!address) return 'ip-unknown'
  if (address.startsWith('::')) return address
  return address.split(':')[0] // discard the port
}

function rateLimiterRequestKey(jwtPayload?: JwtPayload, clientIp?: string) {
  // ideally we want to rate limit by unique user JWT
  if (jwtPayload) {
    const key = jwtPayload.jti ?? jwtPayload.uti?.toString()
    invariant(key, 'Rate limiter key could not be determined, JWT payload has no jti or uti claim')
    return key
  }
  // fallback to rate limiting by client IP
  invariant(clientIp, 'Rate limiter key could not be determined, client IP is missing')
  return clientIp
}

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const key = rateLimiterRequestKey(req.user, req.ip)
  burstyLimiter
    .consume(key)
    .then(({ consumedPoints, remainingPoints, msBeforeNext }) => {
      // TODO remove this logging once rate limiting is stable
      logger.info(`Rate limit consumed for ${key}`, { remainingPoints, consumedPoints, msBeforeNext })
      return next()
    })
    .catch((error) => {
      const loggableErrorData = buildRateLimitErrorLogMetadata(error)
      logger.warn(`Rate limit exceeded on middleware request limiter for key: ${key}`, {
        requestInfo: {
          host: req.hostname,
          method: req.method,
          url: req.originalUrl,
          origin: req.get('Origin') ?? '',
          referer: req.headers.referer?.toString() ?? '',
          clientIp: clientIp(req),
        },
        ...loggableErrorData,
      })
      return next()
      // TODO restore this once rate limiting is stable
      if ('msBeforeNext' in error) {
        const secs = Math.round(error.msBeforeNext / 1000) || 1
        res.set('Retry-After', String(secs))
      }
      res.sendStatus(429)
    })
}
