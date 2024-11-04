import { RedisPubSub } from 'graphql-redis-subscriptions'
import { PubSub } from 'graphql-subscriptions'
import { createRedisClient } from '.'
import { redis } from '../config'
import { Lazy } from '../util/lazy'

export const pubsub = Lazy(() =>
  redis.host ? new RedisPubSub({ publisher: createRedisClient('publisher'), subscriber: createRedisClient('subscriber') }) : new PubSub(),
)
