import { environment, isLocalDev } from '@makerx/node-common'
import type { RedisOptions } from 'ioredis'
import Redis from 'ioredis'
import { camelCase } from 'lodash'
import { redis } from '../config'
import { logger } from '../logger'

export const isRedisEnabled = !!redis.host

if (!isLocalDev && environment !== 'test') {
  if (!isRedisEnabled) {
    logger.warn(`Redis is not configured - this configuration is unexpected for environment: ${environment}`)
  }

  logger.info(`Caching and pubsub configured using ${isRedisEnabled ? 'Managed Redis' : 'in-memory fallback'} `)
  logger.info(`Redis connection options: host=${redis.host ?? '(not set)'}, port=${redis.port}, tls=${!!redis.key}`)
}

export const redisOptions: RedisOptions = {
  host: redis.host,
  port: redis.port,
  password: redis.key,
  tls: redis.key ? {} : undefined,
  // Required for Redis Enterprise — disables cluster-mode handshake checks
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
}

type ClientNames = 'cache' | 'publisher' | 'subscriber' | 'rate limit' | 'oidc'

function keyPrefix(clientName: ClientNames) {
  if (clientName === 'publisher' || clientName === 'subscriber') return 'pubsub:'
  return `${camelCase(clientName)}:`
}

export function createRedisClient(clientName: ClientNames, options: RedisOptions = redisOptions) {
  const prefix = keyPrefix(clientName)
  logger.info(`Creating Redis ${clientName} client with keyPrefix '${prefix}' connecting to ${options.host ?? '(not set)'}:${options.port}`)
  const client = new Redis({ ...options, keyPrefix: prefix })
  client.on('warning', (warning) => logger.warn(`Redis ${clientName} client warning`, warning))
  client.on('error', ({ message, stack, ...rest }) => logger.error(`Redis ${clientName} client error`, { message, stack, ...rest }))
  return client
}
