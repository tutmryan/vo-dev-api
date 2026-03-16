import { environment, isLocalDev } from '@makerx/node-common'
import type { RedisOptions } from 'ioredis'
import Redis from 'ioredis'
import { camelCase } from 'lodash'
import { managedRedis, redis, useManagedRedis } from '../config'
import { logger } from '../logger'

// Select Redis configuration based on feature flag
export const useManaged = useManagedRedis ?? false
const redisConfig = useManaged ? managedRedis : redis
const redisType = useManaged ? 'Managed Redis' : 'Azure Cache for Redis'

export const isRedisEnabled = !!redisConfig?.host

if (!isLocalDev && environment !== 'test') {
  if (!isRedisEnabled) {
    logger.warn(`Redis is not configured - this configuration is unexpected for environment: ${environment}`)
  }

  logger.info(`Caching and pubsub configured using ${isRedisEnabled ? redisType : 'in-memory fallback'} `)
}

export const redisOptions: RedisOptions = {
  host: redisConfig?.host,
  port: redisConfig?.port ?? 6380,
  password: redisConfig?.key,
  tls: redisConfig?.key ? {} : undefined,
}

type ClientNames = 'cache' | 'publisher' | 'subscriber' | 'rate limit' | 'oidc'

function keyPrefix(clientName: ClientNames) {
  if (clientName === 'publisher' || clientName === 'subscriber') return 'pubsub:'
  return `${camelCase(clientName)}:`
}

export function createRedisClient(clientName: ClientNames, options: RedisOptions = redisOptions) {
  const prefix = keyPrefix(clientName)
  logger.info(`Creating Redis ${clientName} client with keyPrefix '${prefix}'`)
  const client = new Redis({ ...options, keyPrefix: prefix })
  client.on('warning', (warning) => logger.warn(`Redis ${clientName} client warning`, warning))
  client.on('error', ({ message, stack, ...rest }) => logger.error(`Redis ${clientName} client error`, { message, stack, ...rest }))
  return client
}
