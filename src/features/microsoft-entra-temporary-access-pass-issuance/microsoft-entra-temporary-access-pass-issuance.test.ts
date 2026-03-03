import { dataSource } from '../../data'
import { GraphService, graphServiceManager } from '../../services/graph-service'
import { IdentityEntity } from '../identity/entities/identity-entity'

import { microsoftEntraTemporaryAccessPassService } from './microsoft-entra-temporary-access-pass-service'

// Mock dependencies
const mockQb = {
  leftJoin: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  innerJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getOne: jest.fn().mockResolvedValue(null),
}

const mockRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQb),
}

jest.mock('../../data', () => ({
  dataSource: {
    getRepository: jest.fn(),
  },
}))

jest.mock('../../services/graph-service', () => ({
  graphServiceManager: {
    get all() {
      return []
    },
    get: jest.fn(),
  },
  GraphService: jest.fn(),
}))

describe('MicrosoftEntraTemporaryAccessPassService', () => {
  const mockGraphService = {
    createTemporaryAccessPass: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(dataSource.getRepository as jest.Mock).mockReturnValue(mockRepo)
    jest.spyOn(graphServiceManager, 'all', 'get').mockReturnValue([mockGraphService as unknown as GraphService])
    ;(graphServiceManager.get as jest.Mock).mockReturnValue(mockGraphService)
  })

  describe('getAvailableSelfServiceActions', () => {
    it('returns empty if disabled', async () => {
      mockQb.getOne.mockResolvedValue(null)

      const identity = new IdentityEntity()
      identity.identityStoreId = 'store1'
      const result = await microsoftEntraTemporaryAccessPassService.getAvailableSelfServiceActions(identity)
      expect(result).toEqual([])
    })

    it('returns actions if enabled', async () => {
      mockQb.getOne.mockResolvedValue({
        id: 'conf1',
        title: 'issue-microsoft-entra-temporary-access-pass',
        enabled: true,
        identityStoreId: 'store1',
      })

      const identity = new IdentityEntity()
      identity.identityStoreId = 'store1'
      const result = await microsoftEntraTemporaryAccessPassService.getAvailableSelfServiceActions(identity)
      expect(result).toHaveLength(1)
      expect(result[0]!.title).toBe('issue-microsoft-entra-temporary-access-pass')
    })
  })

  describe('issueTemporaryAccessPass', () => {
    it('throws if disabled', async () => {
      mockQb.getOne.mockResolvedValue(null)

      const identity = new IdentityEntity()
      identity.id = 'identity-id'
      identity.identityStoreId = 'store1'
      await expect(microsoftEntraTemporaryAccessPassService.issueTemporaryAccessPass(identity)).rejects.toThrow(
        'No Temporary Access Pass configuration found for this identity.',
      )
    })

    it('throws friendly error for guest users', async () => {
      mockQb.getOne.mockResolvedValue({ id: 'conf1', enabled: true, identityStoreId: 'store1' })

      mockGraphService.createTemporaryAccessPass.mockRejectedValue(
        new Error('Temporary Access Pass cannot be added to an external guest user.'),
      )

      const identity = new IdentityEntity()
      identity.id = 'identity-id'
      identity.identityStoreId = 'store1'
      await expect(microsoftEntraTemporaryAccessPassService.issueTemporaryAccessPass(identity)).rejects.toThrow(
        'Cannot issue Temporary Access Pass to Guest Users. Please use a Member account.',
      )
    })

    it('issues Microsoft Entra Temporary Access Pass on success', async () => {
      mockQb.getOne.mockResolvedValue({
        id: 'conf1',
        enabled: true,
        lifetimeMinutes: 30,
        isUsableOnce: false,
        identityStoreId: 'store1',
      })
      mockGraphService.createTemporaryAccessPass.mockResolvedValue({
        temporaryAccessPass: 'secret-tap',
        startDateTime: '2026-01-01T00:00:00Z',
        lifetimeInMinutes: 30,
        isUsableOnce: false,
      })

      const identity = new IdentityEntity()
      identity.id = 'identity-id'
      identity.identifier = 'user-oid'
      identity.identityStoreId = 'store1'
      const result = await microsoftEntraTemporaryAccessPassService.issueTemporaryAccessPass(identity)
      expect(result.temporaryAccessPass).toBe('secret-tap')
      expect(mockGraphService.createTemporaryAccessPass).toHaveBeenCalledWith({
        userId: 'user-oid',
        lifetimeInMinutes: 30,
        isUsableOnce: false,
      })
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          identityStoreId: 'store1',
          identityId: 'identity-id',
          isUsableOnce: false,
          expirationTime: expect.any(Date),
          issuedAt: expect.any(Date),
        }),
      )
    })
  })
})
