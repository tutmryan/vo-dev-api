import { jest } from '@jest/globals'
import type { Config } from '../config'

// Mock the logger to avoid initialization issues
jest.mock('../logger', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}))

describe('Redis connection configuration', () => {
  const originalEnv = process.env
  let mockRedis: Partial<Config['redis']>

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv, NODE_ENV: 'test' }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('when Redis is configured with host, port and key', () => {
    beforeEach(() => {
      mockRedis = {
        host: 'managed-redis.australiaeast.redis.azure.net',
        port: 10000,
        key: 'managed-key',
      }
      jest.doMock('../config', () => ({
        redis: mockRedis,
      }))
    })

    it('should use the configured host and port', async () => {
      const { redisOptions } = await import('./index')

      expect(redisOptions.host).toBe('managed-redis.australiaeast.redis.azure.net')
      expect(redisOptions.port).toBe(10000)
    })

    it('should set password from key', async () => {
      const { redisOptions } = await import('./index')

      expect(redisOptions.password).toBe('managed-key')
    })

    it('should enable TLS when key is present', async () => {
      const { redisOptions } = await import('./index')

      expect(redisOptions.tls).toBeDefined()
    })

    it('should always set enableReadyCheck to false and maxRetriesPerRequest to null', async () => {
      const { redisOptions } = await import('./index')

      expect(redisOptions.enableReadyCheck).toBe(false)
      expect(redisOptions.maxRetriesPerRequest).toBeNull()
    })

    it('should report Redis as enabled', async () => {
      const { isRedisEnabled } = await import('./index')

      expect(isRedisEnabled).toBe(true)
    })
  })

  describe('when Redis is configured without a key (local dev)', () => {
    beforeEach(() => {
      mockRedis = {
        host: 'localhost',
        port: 6380,
        key: '',
      }
      jest.doMock('../config', () => ({
        redis: mockRedis,
      }))
    })

    it('should use the configured host and port', async () => {
      const { redisOptions } = await import('./index')

      expect(redisOptions.host).toBe('localhost')
      expect(redisOptions.port).toBe(6380)
    })

    it('should disable TLS when no key is present', async () => {
      const { redisOptions } = await import('./index')

      expect(redisOptions.tls).toBeUndefined()
    })

    it('should report Redis as enabled', async () => {
      const { isRedisEnabled } = await import('./index')

      expect(isRedisEnabled).toBe(true)
    })
  })

  describe('when Redis host is not configured', () => {
    beforeEach(() => {
      mockRedis = {
        port: 10000,
        key: '',
      }
      jest.doMock('../config', () => ({
        redis: mockRedis,
      }))
    })

    it('should report Redis as not enabled', async () => {
      const { isRedisEnabled } = await import('./index')

      expect(isRedisEnabled).toBe(false)
    })

    it('should disable TLS when no key is present', async () => {
      const { redisOptions } = await import('./index')

      expect(redisOptions.tls).toBeUndefined()
    })
  })
})
