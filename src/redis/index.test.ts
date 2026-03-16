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
  let mockConfig: Partial<Config>

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv, NODE_ENV: 'test' }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('when useManagedRedis is false', () => {
    beforeEach(() => {
      mockConfig = {
        useManagedRedis: false,
        redis: {
          host: 'legacy-redis.cache.windows.net',
          port: 6380,
          key: 'legacy-key',
        },
        managedRedis: {
          host: 'managed-redis.redisenterprise.cache.azure.net',
          port: 10000,
          key: 'managed-key',
        },
      }
      jest.doMock('../config', () => ({
        useManagedRedis: mockConfig.useManagedRedis,
        redis: mockConfig.redis,
        managedRedis: mockConfig.managedRedis,
      }))
    })

    it('should use legacy Redis configuration', async () => {
      const { redisOptions } = await import('./index')

      expect(redisOptions.host).toBe('legacy-redis.cache.windows.net')
      expect(redisOptions.port).toBe(6380)
      expect(redisOptions.password).toBe('legacy-key')
    })

    it('should enable TLS when key is present', async () => {
      const { redisOptions } = await import('./index')

      expect(redisOptions.tls).toBeDefined()
    })
  })

  describe('when useManagedRedis is true', () => {
    beforeEach(() => {
      mockConfig = {
        useManagedRedis: true,
        redis: {
          host: 'legacy-redis.cache.windows.net',
          port: 6380,
          key: 'legacy-key',
        },
        managedRedis: {
          host: 'managed-redis.redisenterprise.cache.azure.net',
          port: 10000,
          key: 'managed-key',
        },
      }
      jest.doMock('../config', () => ({
        useManagedRedis: mockConfig.useManagedRedis,
        redis: mockConfig.redis,
        managedRedis: mockConfig.managedRedis,
      }))
    })

    it('should use Managed Redis configuration', async () => {
      const { redisOptions } = await import('./index')

      expect(redisOptions.host).toBe('managed-redis.redisenterprise.cache.azure.net')
      expect(redisOptions.port).toBe(10000)
      expect(redisOptions.password).toBe('managed-key')
    })

    it('should enable TLS when key is present', async () => {
      const { redisOptions } = await import('./index')

      expect(redisOptions.tls).toBeDefined()
    })
  })

  describe('when useManagedRedis is undefined', () => {
    beforeEach(() => {
      mockConfig = {
        redis: {
          host: 'legacy-redis.cache.windows.net',
          port: 6380,
          key: 'legacy-key',
        },
        managedRedis: {
          host: 'managed-redis.redisenterprise.cache.azure.net',
          port: 10000,
          key: 'managed-key',
        },
      }
      jest.doMock('../config', () => ({
        useManagedRedis: mockConfig.useManagedRedis,
        redis: mockConfig.redis,
        managedRedis: mockConfig.managedRedis,
      }))
    })

    it('should default to legacy Redis configuration', async () => {
      const { redisOptions } = await import('./index')

      expect(redisOptions.host).toBe('legacy-redis.cache.windows.net')
      expect(redisOptions.port).toBe(6380)
      expect(redisOptions.password).toBe('legacy-key')
    })
  })

  describe('when Redis is not configured', () => {
    beforeEach(() => {
      mockConfig = {
        useManagedRedis: false,
        redis: {
          port: 6380,
          key: '',
        },
      }
      jest.doMock('../config', () => ({
        useManagedRedis: mockConfig.useManagedRedis,
        redis: mockConfig.redis,
        managedRedis: mockConfig.managedRedis,
      }))
    })

    it('should indicate Redis is not enabled', async () => {
      const { isRedisEnabled } = await import('./index')

      expect(isRedisEnabled).toBe(false)
    })

    it('should disable TLS when no key is present', async () => {
      const { redisOptions } = await import('./index')

      expect(redisOptions.tls).toBeUndefined()
    })
  })

  describe('port fallback', () => {
    beforeEach(() => {
      mockConfig = {
        useManagedRedis: false,
        redis: {
          host: 'localhost',
          key: '',
        } as Config['redis'],
      }
      jest.doMock('../config', () => ({
        useManagedRedis: mockConfig.useManagedRedis,
        redis: mockConfig.redis,
        managedRedis: mockConfig.managedRedis,
      }))
    })

    it('should default to port 6380 when port is undefined', async () => {
      const { redisOptions } = await import('./index')

      expect(redisOptions.port).toBe(6380)
    })
  })
})
