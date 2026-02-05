import { validateConditionCount, validateFilter, validateFilterDepth } from '../validation/filter-validation'

describe('Filter Validation', () => {
  describe('validateFilterDepth', () => {
    it('should allow filters within depth limit', () => {
      const filter = {
        AND: [
          { contractId: '123' },
          {
            OR: [{ identityId: '456' }, { status: 'Active' }],
          },
        ],
      }
      expect(() => validateFilterDepth(filter)).not.toThrow()
    })

    it('should throw error when depth limit exceeded', () => {
      const filter = {
        AND: [
          {
            OR: [
              {
                AND: [
                  {
                    OR: [{ contractId: '123' }], // Depth 4 - exceeds limit of 3
                  },
                ],
              },
            ],
          },
        ],
      }
      expect(() => validateFilterDepth(filter)).toThrow('Filter depth limit of 3 exceeded')
    })

    it('should handle null and undefined filters', () => {
      expect(() => validateFilterDepth(null)).not.toThrow()
      expect(() => validateFilterDepth(undefined)).not.toThrow()
    })
  })

  describe('validateConditionCount', () => {
    it('should allow filters within condition count limit', () => {
      const filter = {
        contractId: '123',
        identityId: '456',
        status: 'Active',
        from: '2026-01-01',
        to: '2026-01-31',
      }
      expect(() => validateConditionCount(filter)).not.toThrow()
    })

    it('should throw error when condition count exceeded', () => {
      const filter = {
        AND: Array.from({ length: 21 }, (_, i) => ({ contractId: `contract-${i}` })),
      }
      expect(() => validateConditionCount(filter)).toThrow('exceeds the maximum of 20')
    })

    it('should count nested conditions correctly', () => {
      const filter = {
        contractId: '123', // 1
        AND: [
          { identityId: '456' }, // 2
          { status: 'Active' }, // 3
          {
            OR: [
              { from: '2026-01-01' }, // 4
              { to: '2026-01-31' }, // 5
            ],
          },
        ],
      }
      // Total: 5 conditions - should pass
      expect(() => validateConditionCount(filter)).not.toThrow()
    })
  })

  describe('validateFilter', () => {
    it('should validate both depth and condition count', () => {
      const validFilter = {
        AND: [{ contractId: '123' }, { OR: [{ identityId: '456' }, { status: 'Active' }] }],
      }
      expect(() => validateFilter(validFilter)).not.toThrow()

      const tooDeepFilter = {
        AND: [{ OR: [{ AND: [{ OR: [{ contractId: '123' }] }] }] }],
      }
      expect(() => validateFilter(tooDeepFilter)).toThrow('depth limit')

      const tooManyConditions = {
        AND: Array.from({ length: 21 }, (_, i) => ({ contractId: `contract-${i}` })),
      }
      expect(() => validateFilter(tooManyConditions)).toThrow('exceeds the maximum')
    })

    it('should handle null filters', () => {
      expect(() => validateFilter(null)).not.toThrow()
      expect(() => validateFilter(undefined)).not.toThrow()
    })
  })
})
