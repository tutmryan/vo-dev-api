import type { QueryContext } from '../../../cqs'
import { CountIssuancesByDateQuery } from '../queries/count-issuances-by-date-query'
import { createTestData, testTime, toISODate } from './count-test-helpers'

describe('CountIssuancesByDateQuery', () => {
  it('should return issuance counts grouped by date', async () => {
    const { contracts, users, identities } = await createTestData()
    const context = {
      dataLoaders: {
        contracts: { load: jest.fn((id: string) => contracts.find((c) => c.id === id)) },
        users: { load: jest.fn((id: string) => users.find((u) => u.id === id)) },
        identities: { load: jest.fn((id: string) => identities.find((i) => i.id === id)) },
      },
      entityManager: {
        getRepository: jest.fn(() => ({
          createQueryBuilder: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            comment: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockResolvedValue([
              { date: toISODate(testTime), count: '2' },
              { date: '2023-01-02', count: '1' },
            ]),
          })),
        })),
      },
    } as unknown as QueryContext

    const result = await CountIssuancesByDateQuery.call(context, {})
    expect(result).toEqual([
      { date: toISODate(testTime), count: 2 },
      { date: '2023-01-02', count: 1 },
    ])
  })
})
