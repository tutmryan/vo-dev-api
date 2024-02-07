import { KeyvAdapter } from '@apollo/utils.keyvadapter'
import type { RedisOptions } from 'bullmq'
import { RedisPubSub } from 'graphql-redis-subscriptions'
import Keyv from 'keyv'
import { redis as redisConfig } from './config'
import { Lazy } from './util/lazy'

const isRedisEnabled = !!redisConfig.host
const redisPort = 6380
export const redisConnectionString = isRedisEnabled
  ? redisConfig.key
    ? `rediss://:${redisConfig.key}@${redisConfig.host}:${redisPort}`
    : `redis://${redisConfig.host}:${redisPort}`
  : undefined

export const redisOptions: RedisOptions = {
  host: redisConfig.host,
  port: redisPort,
  password: redisConfig.key,
}

const keyv = Lazy(() => new Keyv(redisConnectionString, { namespace: 'cache' }))
export const redisKeyVAdapter = (): KeyvAdapter => new KeyvAdapter(keyv())

export const redisPubsub = Lazy(() => new RedisPubSub({ connection: redisConnectionString }))
