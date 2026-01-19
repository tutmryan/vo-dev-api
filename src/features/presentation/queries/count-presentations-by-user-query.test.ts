import type { QueryContext } from '../../../cqs'
import { createTestData } from '../../issuance/tests/count-test-helpers'
import { CountPresentationsByUserQuery } from './count-presentations-by-user-query'

describe('CountPresentationsByUserQuery', () => {
  it('should return presentation counts grouped by user', async () => {
    const { contracts, users, identities } = await createTestData()
    const context = {
      dataLoaders: {
        contracts: { load: jest.fn((id: string) => contracts.find((c: { id: string }) => c.id === id)) },
        users: { load: jest.fn((id: string) => Promise.resolve(users.find((u: { id: string }) => u.id === id))) },
        identities: { load: jest.fn((id: string) => identities.find((i: { id: string }) => i.id === id)) },
      },
      entityManager: {
        getRepository: jest.fn(() => ({
          createQueryBuilder: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            comment: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockResolvedValue([
              { requested_by_id: users[0]!.id, count: 2 },
              { requested_by_id: users[1]!.id, count: 1 },
            ]),
          })),
        })),
      },
    } as unknown as QueryContext

    const result = await CountPresentationsByUserQuery.call(context, {}, 0, 10)
    expect(result).toHaveLength(2)
    expect(await result[0]!.user).toEqual(users[0])
    expect(result[0]!.count).toBe(2)
  })
})
