import type { NextFunction, Request, Response } from 'express'
import { GraphQLError } from 'graphql'
import type { RateLimiterAbstract } from 'rate-limiter-flexible'
import { BurstyRateLimiter } from 'rate-limiter-flexible'
import { codeExpiryMinutes } from './features/limited-async-issuance-tokens'
import { logger } from './logger'
import { rateLimiter } from './redis'

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

export const acquireAsyncIssuanceTokenLimiter = rateLimiter({
  points: 10,
  duration: 60 * codeExpiryMinutes,
  keyPrefix: 'rate-limit-acquireAsyncIssuanceToken',
})

export const consumeRateLimit = async (limiter: RateLimiterAbstract, key: string, errorMessage = 'Rate limit exceeded') => {
  try {
    await limiter.consume(key)
  } catch (error) {
    logger.warn(`Rate limit exceeded on limiter: ${limiter.keyPrefix} for key: ${key}`, { error })
    throw new GraphQLError(errorMessage, {
      extensions: { code: 'TOO_MANY_REQUESTS', http: { status: 429 } },
    })
  }
}

const clientIp = (req: Request) => req.headers['x-forwarded-for']?.toString() ?? req.socket.remoteAddress
const rateLimiterRequestKey = (req: Request) => `${clientIp(req)}-${req.user?.jti ?? req.user?.uti}`

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const key = rateLimiterRequestKey(req)
  burstyLimiter
    .consume(key)
    .then(() => {
      return next()
    })
    .catch((error) => {
      logger.warn(`Rate limit exceeded on middleware request limiter for key: ${key}`, {
        request: {
          host: req.hostname,
          method: req.method,
          url: req.originalUrl,
          origin: req.get('Origin') ?? '',
          referer: req.headers.referer?.toString() ?? '',
          clientIp: clientIp(req),
        },
      })
      if ('msBeforeNext' in error) {
        const secs = Math.round(error.msBeforeNext / 1000) || 1
        res.set('Retry-After', String(secs))
      }
      res.sendStatus(429)
    })
}
