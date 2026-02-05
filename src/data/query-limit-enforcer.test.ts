import { GraphQLError } from 'graphql'
import type { ObjectLiteral, Repository } from 'typeorm'
import { DEFAULT_QUERY_LIMIT } from '../util/typeorm'
import { wrapRepositoryWithSafeLimits } from './query-limit-enforcer'

describe('wrapRepositoryWithSafeLimits', () => {
  let mockRepository: Repository<ObjectLiteral>
  let originalFind: jest.Mock
  let originalFindAndCount: jest.Mock
  let originalFindOne: jest.Mock
  let originalCreateQueryBuilder: jest.Mock

  beforeEach(() => {
    originalFind = jest.fn()
    originalFindAndCount = jest.fn()
    originalFindOne = jest.fn()
    originalCreateQueryBuilder = jest.fn()

    mockRepository = {
      find: originalFind,
      findAndCount: originalFindAndCount,
      findOne: originalFindOne,
      createQueryBuilder: originalCreateQueryBuilder,
      metadata: { tableName: 'test_table' },
    } as unknown as Repository<ObjectLiteral>
  })

  describe('find method', () => {
    it('should apply DEFAULT_QUERY_LIMIT when no options provided', async () => {
      originalFind.mockResolvedValue([])
      const wrapped = wrapRepositoryWithSafeLimits(mockRepository)

      await wrapped.find()

      expect(originalFind).toHaveBeenCalledWith({ take: DEFAULT_QUERY_LIMIT })
    })

    it('should apply DEFAULT_QUERY_LIMIT when options provided but no take', async () => {
      originalFind.mockResolvedValue([])
      const wrapped = wrapRepositoryWithSafeLimits(mockRepository)

      await wrapped.find({ where: { id: 1 } })

      expect(originalFind).toHaveBeenCalledWith({ where: { id: 1 }, take: DEFAULT_QUERY_LIMIT })
    })

    it('should preserve requested limit when under max', async () => {
      originalFind.mockResolvedValue([])
      const wrapped = wrapRepositoryWithSafeLimits(mockRepository)

      await wrapped.find({ take: 50 })

      expect(originalFind).toHaveBeenCalledWith({ take: 50 })
    })

    it('should throw GraphQLError when limit exceeds maximum', async () => {
      const wrapped = wrapRepositoryWithSafeLimits(mockRepository)

      await expect(wrapped.find({ take: 5000 })).rejects.toThrow(GraphQLError)
      await expect(wrapped.find({ take: 1001 })).rejects.toThrow('Limit exceeded')
    })

    it('should preserve other options when applying limit', async () => {
      originalFind.mockResolvedValue([])
      const wrapped = wrapRepositoryWithSafeLimits(mockRepository)

      await wrapped.find({
        where: { active: true },
        order: { createdAt: 'DESC' },
        skip: 10,
      })

      expect(originalFind).toHaveBeenCalledWith({
        where: { active: true },
        order: { createdAt: 'DESC' },
        skip: 10,
        take: DEFAULT_QUERY_LIMIT,
      })
    })
  })

  describe('findAndCount method', () => {
    it('should apply DEFAULT_QUERY_LIMIT when no options provided', async () => {
      originalFindAndCount.mockResolvedValue([[], 0])
      const wrapped = wrapRepositoryWithSafeLimits(mockRepository)

      await wrapped.findAndCount()

      expect(originalFindAndCount).toHaveBeenCalledWith({ take: DEFAULT_QUERY_LIMIT })
    })

    it('should apply DEFAULT_QUERY_LIMIT when options provided but no take', async () => {
      originalFindAndCount.mockResolvedValue([[], 0])
      const wrapped = wrapRepositoryWithSafeLimits(mockRepository)

      await wrapped.findAndCount({ where: { id: 1 } })

      expect(originalFindAndCount).toHaveBeenCalledWith({ where: { id: 1 }, take: DEFAULT_QUERY_LIMIT })
    })

    it('should preserve requested limit when under max', async () => {
      originalFindAndCount.mockResolvedValue([[], 0])
      const wrapped = wrapRepositoryWithSafeLimits(mockRepository)

      await wrapped.findAndCount({ take: 75 })

      expect(originalFindAndCount).toHaveBeenCalledWith({ take: 75 })
    })

    it('should throw GraphQLError when limit exceeds maximum', async () => {
      const wrapped = wrapRepositoryWithSafeLimits(mockRepository)

      await expect(wrapped.findAndCount({ take: 10000 })).rejects.toThrow(GraphQLError)
      await expect(wrapped.findAndCount({ take: 1001 })).rejects.toThrow('Limit exceeded')
    })
  })
})
