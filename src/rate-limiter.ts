import type { NextFunction, Request, Response } from 'express'
import Redis from 'ioredis'
import { RateLimiterRedis } from 'rate-limiter-flexible'
import { redisOptions } from './redis'

const redisClient = new Redis(redisOptions)
const rateLimiterRedis = new RateLimiterRedis({
  storeClient: redisClient,
  points: 10,
  duration: 1,
  inMemoryBlockOnConsumed: 10,
})

const rateLimiterRequestKey = (req: Request) => `${req.ip}-${req.user?.jti ?? req.user?.uti}`

const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  rateLimiterRedis
    .consume(rateLimiterRequestKey(req))
    .then(() => {
      return next()
    })
    .catch(() => {
      res.sendStatus(429)
    })
}

export default rateLimiterMiddleware
