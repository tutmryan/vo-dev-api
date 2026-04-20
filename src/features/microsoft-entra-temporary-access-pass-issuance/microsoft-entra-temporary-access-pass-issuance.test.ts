import { dataSource } from '../../data'
import { GraphService, graphServiceManager, PartialUser } from '../../services/graph-service'
import { IdentityEntity } from '../identity/entities/identity-entity'

import { logger } from '../../logger'
import { microsoftEntraTemporaryAccessPassService } from './microsoft-entra-temporary-access-pass-service'

jest.mock('../../logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    auditEvent: jest.fn(),
  },
}))

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
  find: jest.fn().mockResolvedValue([]),
  save: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQb),
}

jest.mock('../../data', () => ({
  dataSource: {
    getRepository: jest.fn(),
  },
}))

jest.mock('../../rate-limiter', () => ({
  consumeRateLimit: jest.fn(),
}))

describe('MicrosoftEntraTemporaryAccessPassService', () => {
  const mockGraphService = {
    createTemporaryAccessPass: jest.fn(),
    getUserById: jest.fn(),
    listTemporaryAccessPassMethods: jest.fn(),
    checkUserTapEligibility: jest.fn(),
    getActiveUnusedTap: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(dataSource.getRepository as jest.Mock).mockReturnValue(mockRepo)
    jest.spyOn(graphServiceManager, 'get').mockReturnValue(mockGraphService as unknown as GraphService)
    jest.spyOn(graphServiceManager, 'all', 'get').mockReturnValue([mockGraphService as unknown as GraphService])

    // Default mock behavior
    mockGraphService.getUserById.mockResolvedValue({ userType: 'Member' } as PartialUser)
    mockGraphService.listTemporaryAccessPassMethods.mockResolvedValue([])
    mockGraphService.checkUserTapEligibility.mockResolvedValue({ isEligible: true })
    mockGraphService.getActiveUnusedTap.mockResolvedValue(null)
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
      expect(result[0]!.enabled).toBe(true)
      expect(result[0]!.isEligible).toBe(true)
    })

    it('returns disabled action if config itself is disabled', async () => {
      mockQb.getOne.mockResolvedValue({
        id: 'conf1',
        title: 'issue-microsoft-entra-temporary-access-pass',
        enabled: false,
        identityStoreId: 'store1',
      })

      const identity = new IdentityEntity()
      identity.identityStoreId = 'store1'
      const result = await microsoftEntraTemporaryAccessPassService.getAvailableSelfServiceActions(identity)
      expect(result).toHaveLength(1)
      expect(result[0]!.enabled).toBe(false)
      expect(result[0]!.isEligible).toBe(true)
      expect(result[0]!.unavailableReason).toBe('Self-service Temporary Access Pass issuance is currently disabled.')
      expect(result[0]!.unavailableReasonCode).toBe('SELF_SERVICE_DISABLED')
    })

    it('returns disabled action for Guest users', async () => {
      mockQb.getOne.mockResolvedValue({
        id: 'conf1',
        title: 'issue-microsoft-entra-temporary-access-pass',
        enabled: true,
        identityStoreId: 'store1',
      })
      mockGraphService.getUserById.mockResolvedValue({ userType: 'Guest' })

      const identity = new IdentityEntity()
      identity.identityStoreId = 'store1'
      const result = await microsoftEntraTemporaryAccessPassService.getAvailableSelfServiceActions(identity)
      expect(result).toHaveLength(1)
      expect(result[0]!.enabled).toBe(true)
      expect(result[0]!.isEligible).toBe(false)
      expect(result[0]!.unavailableReason).toBe('Guest users are not eligible for self-service Temporary Access Pass.')
      expect(result[0]!.unavailableReasonCode).toBe('GUEST_USER_NOT_ELIGIBLE')
    })

    it('returns disabled action if TAP already exists', async () => {
      mockQb.getOne.mockResolvedValue({
        id: 'conf1',
        title: 'issue-microsoft-entra-temporary-access-pass',
        enabled: true,
        identityStoreId: 'store1',
      })
      mockGraphService.listTemporaryAccessPassMethods.mockResolvedValue([{ id: 'tap1' }])
      mockGraphService.getActiveUnusedTap.mockResolvedValue({ id: 'tap1', isUsable: true, methodUsabilityReason: 'EnabledByPolicy' })

      const identity = new IdentityEntity()
      identity.identityStoreId = 'store1'
      const result = await microsoftEntraTemporaryAccessPassService.getAvailableSelfServiceActions(identity)
      expect(result).toHaveLength(1)
      expect(result[0]!.enabled).toBe(true)
      expect(result[0]!.isEligible).toBe(false)
      expect(result[0]!.unavailableReason).toBe('You already have an active Temporary Access Pass.')
      expect(result[0]!.unavailableReasonCode).toBe('ALREADY_HAS_ACTIVE_TAP')
    })

    it('returns disabled action if policy is missing permissions', async () => {
      mockQb.getOne.mockResolvedValue({
        id: 'conf1',
        title: 'issue-microsoft-entra-temporary-access-pass',
        enabled: true,
        identityStoreId: 'store1',
      })
      mockGraphService.checkUserTapEligibility.mockResolvedValue({ isEligible: false, reason: 'missing_permissions' })

      const identity = new IdentityEntity()
      identity.identityStoreId = 'store1'
      const result = await microsoftEntraTemporaryAccessPassService.getAvailableSelfServiceActions(identity)
      expect(result).toHaveLength(1)
      expect(result[0]!.enabled).toBe(true)
      expect(result[0]!.isEligible).toBe(false)
      expect(result[0]!.unavailableReason).toBe('Missing permissions to check TAP eligibility. Please contact your administrator.')
      expect(result[0]!.unavailableReasonCode).toBe('MISSING_PERMISSIONS')
    })

    it('returns disabled action if policy is not found', async () => {
      mockQb.getOne.mockResolvedValue({
        id: 'conf1',
        title: 'issue-microsoft-entra-temporary-access-pass',
        enabled: true,
        identityStoreId: 'store1',
      })
      mockGraphService.checkUserTapEligibility.mockResolvedValue({ isEligible: false, reason: 'policy_not_found' })

      const identity = new IdentityEntity()
      identity.identityStoreId = 'store1'
      const result = await microsoftEntraTemporaryAccessPassService.getAvailableSelfServiceActions(identity)
      expect(result).toHaveLength(1)
      expect(result[0]!.enabled).toBe(true)
      expect(result[0]!.isEligible).toBe(false)
      expect(result[0]!.unavailableReason).toBe('Temporary Access Pass policy not found in your organisation.')
    })

    it('returns empty array if an exception is thrown during eligibility check', async () => {
      mockQb.getOne.mockResolvedValue({
        id: 'conf1',
        enabled: true,
        identityStoreId: 'store1',
      })
      mockGraphService.checkUserTapEligibility.mockRejectedValue(new Error('Graph error'))

      const identity = new IdentityEntity()
      identity.identityStoreId = 'store1'
      const result = await microsoftEntraTemporaryAccessPassService.getAvailableSelfServiceActions(identity)
      expect(result).toEqual([])
      expect(logger.error).toHaveBeenCalled()
    })

    it('returns descriptive reason when service is not configured', async () => {
      mockQb.getOne.mockResolvedValue({
        id: 'conf1',
        enabled: true,
        identityStoreId: 'store-missing',
      })
      jest.spyOn(graphServiceManager, 'get').mockReturnValueOnce(undefined)

      const identity = new IdentityEntity()
      identity.identityStoreId = 'store-missing'
      const result = await microsoftEntraTemporaryAccessPassService.getAvailableSelfServiceActions(identity)
      expect(result).toHaveLength(1)
      expect(result[0]!.unavailableReason).toBe('Service not configured for identity store store-missing.')
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

    it('throws if config is explicitly disabled', async () => {
      mockQb.getOne.mockResolvedValue({ id: 'conf1', enabled: false, identityStoreId: 'store1' })

      const identity = new IdentityEntity()
      identity.id = 'identity-id'
      identity.identityStoreId = 'store1'
      await expect(microsoftEntraTemporaryAccessPassService.issueTemporaryAccessPass(identity)).rejects.toThrow(
        'Self-service Temporary Access Pass issuance is currently disabled.',
      )
    })

    it('throws if user is a Guest', async () => {
      mockQb.getOne.mockResolvedValue({ id: 'conf1', enabled: true, identityStoreId: 'store1' })
      mockGraphService.getUserById.mockResolvedValue({ userType: 'Guest' })

      const identity = new IdentityEntity()
      identity.id = 'identity-id'
      identity.identityStoreId = 'store1'
      await expect(microsoftEntraTemporaryAccessPassService.issueTemporaryAccessPass(identity)).rejects.toThrow(
        'Guest users are not eligible for self-service Temporary Access Pass.',
      )
    })

    it('throws if TAP already exists', async () => {
      mockQb.getOne.mockResolvedValue({ id: 'conf1', enabled: true, identityStoreId: 'store1' })
      mockGraphService.listTemporaryAccessPassMethods.mockResolvedValue([{ id: 'tap1' }])
      mockGraphService.getActiveUnusedTap.mockResolvedValue({ id: 'tap1', isUsable: true, methodUsabilityReason: 'EnabledByPolicy' })

      const identity = new IdentityEntity()
      identity.id = 'identity-id'
      identity.identityStoreId = 'store1'
      await expect(microsoftEntraTemporaryAccessPassService.issueTemporaryAccessPass(identity)).rejects.toThrow(
        'You already have an active Temporary Access Pass.',
      )
    })

    it('throws friendly error for guest users on Graph Error', async () => {
      // This covers the legacy catch block logic if it still triggers for some reason
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
        id: 'tap-id',
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

    it('audits failure with error message if issuance fails', async () => {
      mockQb.getOne.mockResolvedValue({
        id: 'conf1',
        enabled: true,
        identityStoreId: 'store1',
      })
      mockGraphService.createTemporaryAccessPass.mockRejectedValue(new Error('Something went wrong'))

      const identity = new IdentityEntity()
      identity.id = 'identity-id'
      identity.identityStoreId = 'store1'

      await expect(microsoftEntraTemporaryAccessPassService.issueTemporaryAccessPass(identity)).rejects.toThrow('Something went wrong')

      expect(logger.auditEvent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          error: 'Something went wrong',
          identityStoreId: 'store1',
        }),
      )
    })
  })
})
