import type { NextFunction, Request, Response } from 'express'
import { GraphQLError } from 'graphql'
import type { RateLimiterAbstract } from 'rate-limiter-flexible'
import { BurstyRateLimiter } from 'rate-limiter-flexible'
import { codeExpiryMinutes } from './features/limited-async-issuance-tokens'
import { logger } from './logger'
import { rateLimiter } from './redis'

const burstyLimiter = new BurstyRateLimiter(
  rateLimiter({
    points: 10,
    duration: 1,
    inMemoryBlockOnConsumed: 10,
  }),
  rateLimiter({
    points: 100,
    duration: 5,
    keyPrefix: 'burst',
    inMemoryBlockOnConsumed: 100,
  }),
)

export const acquireAsyncIssuanceTokenLimiter = rateLimiter({
  points: 10,
  duration: 60 * codeExpiryMinutes,
  keyPrefix: 'acquireAsyncIssuanceToken',
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

const rateLimiterRequestKey = (req: Request) => `${req.ip}-${req.user?.jti ?? req.user?.uti}`

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  burstyLimiter
    .consume(rateLimiterRequestKey(req))
    .then(() => {
      return next()
    })
    .catch(() => {
      logger.warn(`Rate limit exceeded on middleware request limiter for key: ${rateLimiterRequestKey(req)}`, {
        request: {
          host: req.hostname,
          method: req.method,
          url: req.originalUrl,
          origin: req.get('Origin') ?? '',
          referer: req.headers.referer?.toString() ?? '',
        },
      })
      res.sendStatus(429)
    })
}
