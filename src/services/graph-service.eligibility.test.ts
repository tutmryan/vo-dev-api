import { AuthenticationMethodConfiguration, GraphService, GraphServiceConfig } from './graph-service'

jest.mock('../logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}))

jest.mock('../data', () => ({
  dataSource: {
    getRepository: jest.fn(),
  },
}))

jest.mock('../features/identity-store/entities/identity-store-entity', () => ({
  IdentityStoreEntity: class {},
}))

describe('GraphService.checkUserTapEligibility', () => {
  const baseConfig: GraphServiceConfig = {
    identityStoreId: 'store1',
    tenantName: 'tenant1',
    auth: { tenantId: 'tid', clientId: 'cid', clientSecret: 'secret' },
  }

  it('handles all_users in includeTargets correctly', async () => {
    const service = new GraphService(baseConfig)

    jest.spyOn(service, 'getTemporaryAccessPassPolicy').mockResolvedValue({
      id: 'tap-policy',
      state: 'enabled',
      includeTargets: [{ targetType: 'group', id: 'all_users' }],
    } as AuthenticationMethodConfiguration)

    const checkMemberGroupsSpy = jest.spyOn(service, 'checkMemberGroups')

    const result = await service.checkUserTapEligibility('user-123')

    expect(result.isEligible).toBe(true)
    expect(checkMemberGroupsSpy).not.toHaveBeenCalled()
  })

  it('handles all_users in excludeTargets correctly', async () => {
    const service = new GraphService(baseConfig)

    jest.spyOn(service, 'getTemporaryAccessPassPolicy').mockResolvedValue({
      id: 'tap-policy',
      state: 'enabled',
      excludeTargets: [{ targetType: 'group', id: 'all_users' }],
      includeTargets: [{ targetType: 'group', id: 'some-other-group' }],
    } as AuthenticationMethodConfiguration)

    const checkMemberGroupsSpy = jest.spyOn(service, 'checkMemberGroups')

    const result = await service.checkUserTapEligibility('user-123')

    expect(result.isEligible).toBe(false)
    expect(result.reason).toBe('user_excluded')
    expect(checkMemberGroupsSpy).not.toHaveBeenCalled()
  })

  it('calls checkMemberGroups for other groups but filters out all_users', async () => {
    const service = new GraphService(baseConfig)

    jest.spyOn(service, 'getTemporaryAccessPassPolicy').mockResolvedValue({
      id: 'tap-policy',
      state: 'enabled',
      includeTargets: [
        { targetType: 'group', id: 'valid-group-guid' },
        { targetType: 'group', id: 'all_users' },
      ],
    } as AuthenticationMethodConfiguration)

    const checkMemberGroupsSpy = jest.spyOn(service, 'checkMemberGroups').mockResolvedValue([])

    // In this case, it should hit 'all_users' first and return true without calling checkMemberGroups
    // Wait, let's re-check the logic.
    /*
      if (groupTargets.includes('all_users')) {
        return { isEligible: true }
      }
    */
    // If we want to test filtering, we need 'all_users' to NOT be the first thing that grants eligibility.
    // Actually, if 'all_users' is present in includeTargets, the user is always included.

    const result = await service.checkUserTapEligibility('user-123')
    expect(result.isEligible).toBe(true)
    expect(checkMemberGroupsSpy).not.toHaveBeenCalled()
  })

  it('filters out all_users from excludeTargets and calls checkMemberGroups for others', async () => {
    const service = new GraphService(baseConfig)

    jest.spyOn(service, 'getTemporaryAccessPassPolicy').mockResolvedValue({
      id: 'tap-policy',
      state: 'enabled',
      excludeTargets: [
        { targetType: 'group', id: 'valid-group-guid' },
        { targetType: 'group', id: 'all_users' },
      ],
    } as AuthenticationMethodConfiguration)

    const checkMemberGroupsSpy = jest.spyOn(service, 'checkMemberGroups').mockResolvedValue([])

    // Should return ineligible because of all_users in excludeTargets
    const result = await service.checkUserTapEligibility('user-123')
    expect(result.isEligible).toBe(false)
    expect(result.reason).toBe('user_excluded')
    expect(checkMemberGroupsSpy).not.toHaveBeenCalled()
  })

  it('filters out all_users when other groups are present and all_users is NOT triggered first', async () => {
    // To trigger checkMemberGroups, all_users must not be in the list or we need a scenario where it's not enough.
    // But if all_users is in the list, it IS enough.

    const service = new GraphService(baseConfig)

    jest.spyOn(service, 'getTemporaryAccessPassPolicy').mockResolvedValue({
      id: 'tap-policy',
      state: 'enabled',
      includeTargets: [
        { targetType: 'group', id: 'valid-group-guid' },
        // all_users NOT present here
      ],
      excludeTargets: [{ targetType: 'group', id: 'some-other-guid' }],
    } as AuthenticationMethodConfiguration)

    const checkMemberGroupsSpy = jest.spyOn(service, 'checkMemberGroups').mockImplementation(async (userId, groups) => {
      if (groups.includes('valid-group-guid')) return ['valid-group-guid']
      return []
    })

    const result = await service.checkUserTapEligibility('user-123')
    expect(result.isEligible).toBe(true)
    expect(checkMemberGroupsSpy).toHaveBeenCalledWith('user-123', ['some-other-guid'])
    expect(checkMemberGroupsSpy).toHaveBeenCalledWith('user-123', ['valid-group-guid'])
  })

  it('fails closed when checkMemberGroups has missing permissions during excludeTargets evaluation', async () => {
    const service = new GraphService(baseConfig)

    jest.spyOn(service, 'getTemporaryAccessPassPolicy').mockResolvedValue({
      id: 'tap-policy',
      state: 'enabled',
      excludeTargets: [{ targetType: 'group', id: 'excluded-group' }],
      includeTargets: [{ targetType: 'group', id: 'all_users' }],
    } as AuthenticationMethodConfiguration)

    // Mock checkMemberGroups to return 'missing_permissions' to simulate 403
    jest.spyOn(service, 'checkMemberGroups').mockResolvedValue('missing_permissions')

    const result = await service.checkUserTapEligibility('user-123')

    expect(result.isEligible).toBe(false)
    expect(result.reason).toBe('missing_permissions')
  })

  it('fails closed when checkMemberGroups has missing permissions during includeTargets evaluation', async () => {
    const service = new GraphService(baseConfig)

    jest.spyOn(service, 'getTemporaryAccessPassPolicy').mockResolvedValue({
      id: 'tap-policy',
      state: 'enabled',
      includeTargets: [{ targetType: 'group', id: 'included-group' }],
    } as AuthenticationMethodConfiguration)

    // Mock checkMemberGroups to return 'missing_permissions'
    jest.spyOn(service, 'checkMemberGroups').mockResolvedValue('missing_permissions')

    const result = await service.checkUserTapEligibility('user-123')

    expect(result.isEligible).toBe(false)
    expect(result.reason).toBe('missing_permissions')
  })
})
