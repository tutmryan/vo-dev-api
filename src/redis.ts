import { KeyvAdapter } from '@apollo/utils.keyvadapter'
import type { RedisOptions } from 'bullmq'
import { RedisPubSub } from 'graphql-redis-subscriptions'
import Keyv from 'keyv'
import config from './config'
import { Lazy } from './util/lazy'

const redisConfig = config.has('redis') ? config.get('redis') : undefined
const isRedisEnabled = !!redisConfig?.host
const redisPort = 6380
export const redisConnectionString = isRedisEnabled
  ? redisConfig.key
    ? `rediss://:${redisConfig.key}@${redisConfig.host}:${redisPort}`
    : `redis://${redisConfig.host}:${redisPort}`
  : undefined

export const redisOptions: RedisOptions = {
  host: redisConfig?.host,
  port: redisPort,
  password: redisConfig?.key,
  tls: redisConfig?.key ? {} : undefined,
}

const keyv = Lazy(() => new Keyv(redisConnectionString, { namespace: 'cache' }))
export const redisKeyVAdapter = (): KeyvAdapter => new KeyvAdapter(keyv())

export const redisPubsub = Lazy(() => new RedisPubSub({ connection: redisConnectionString }))
