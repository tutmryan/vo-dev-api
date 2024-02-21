import type { NextFunction, Request, Response } from 'express'
import Redis from 'ioredis'
import { BurstyRateLimiter, RateLimiterRedis } from 'rate-limiter-flexible'
import { redisOptions } from './redis'

const redisClient = new Redis(redisOptions)

const burstyLimiter = new BurstyRateLimiter(
  new RateLimiterRedis({
    storeClient: redisClient,
    points: 10,
    duration: 1,
    inMemoryBlockOnConsumed: 10,
  }),
  new RateLimiterRedis({
    storeClient: redisClient,
    points: 100,
    duration: 5,
    keyPrefix: 'burst',
    inMemoryBlockOnConsumed: 100,
  }),
)

const rateLimiterRequestKey = (req: Request) => `${req.ip}-${req.user?.jti ?? req.user?.uti}`

const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  burstyLimiter
    .consume(rateLimiterRequestKey(req))
    .then(() => {
      return next()
    })
    .catch(() => {
      res.sendStatus(429)
    })
}

export default rateLimiterMiddleware
