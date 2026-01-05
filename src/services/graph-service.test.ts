import { AccessPackageAssignmentPolicy, GraphService, GraphServiceConfig } from './graph-service'

describe('GraphService.findAccessPackages', () => {
  const baseConfig: GraphServiceConfig = {
    identityStoreId: 'store1',
    tenantName: 'tenant1',
    auth: { tenantId: 'tid', clientId: 'cid', clientSecret: 'secret' },
  }

  function createService(policies: AccessPackageAssignmentPolicy[]) {
    const service = new GraphService(baseConfig)
    jest.spyOn(service, 'getAccessPackageAssignmentPolicies').mockResolvedValue(policies)
    return service
  }

  it('returns only policies with any matching credentialType, and includes all required fields', async () => {
    const policies: AccessPackageAssignmentPolicy[] = [
      {
        id: 'p1',
        displayName: 'Policy 1',
        description: 'Policy 1 desc',
        accessPackage: { id: 'ap1', displayName: 'AP1', description: 'desc' },
        verifiableCredentialSettings: { credentialTypes: [{ credentialType: 'A' }, { credentialType: 'B' }] },
      },
      {
        id: 'p2',
        displayName: 'Policy 2',
        description: 'Policy 2 desc',
        accessPackage: { id: 'ap2', displayName: 'AP2', description: 'desc2' },
        verifiableCredentialSettings: { credentialTypes: [{ credentialType: 'C' }] },
      },
    ]
    const service = createService(policies)
    const result = await service.findAccessPackages(['B', 'C'])
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      id: 'ap1',
      displayName: 'AP1',
      description: 'desc',
      credentialTypes: ['B'],
      identityStoreName: baseConfig.tenantName,
      identityStoreId: baseConfig.identityStoreId,
      policyDisplayName: 'Policy 1',
      policyDisplayDescription: 'Policy 1 desc',
    })
    expect(result[1]).toMatchObject({
      id: 'ap2',
      displayName: 'AP2',
      description: 'desc2',
      credentialTypes: ['C'],
      identityStoreName: baseConfig.tenantName,
      identityStoreId: baseConfig.identityStoreId,
      policyDisplayName: 'Policy 2',
      policyDisplayDescription: 'Policy 2 desc',
    })
  })

  it('returns only intersection of credentialTypes, deduplicated and sorted', async () => {
    const policies: AccessPackageAssignmentPolicy[] = [
      {
        id: 'p1',
        displayName: 'Policy 1',
        accessPackage: { id: 'ap1', displayName: 'AP1', description: 'desc' },
        verifiableCredentialSettings: {
          credentialTypes: [{ credentialType: 'B' }, { credentialType: 'A' }, { credentialType: 'A' }, { credentialType: 'C' }],
        },
      },
    ]
    const service = createService(policies)
    const result = await service.findAccessPackages(['A', 'B', 'C'])
    expect(result).toHaveLength(1)
    // Should be deduplicated and sorted
    expect(result[0]!.credentialTypes).toEqual(['A', 'B', 'C'])
  })

  it('returns empty if no credentialTypes match', async () => {
    const policies: AccessPackageAssignmentPolicy[] = [
      {
        id: 'p1',
        displayName: 'Policy 1',
        accessPackage: { id: 'ap1', displayName: 'AP1', description: 'desc' },
        verifiableCredentialSettings: { credentialTypes: [{ credentialType: 'A' }] },
      },
    ]
    const service = createService(policies)
    const result = await service.findAccessPackages(['B'])
    expect(result).toHaveLength(0)
  })

  it('returns empty if policy has no credentialTypes', async () => {
    const policies: AccessPackageAssignmentPolicy[] = [
      {
        id: 'p1',
        displayName: 'Policy 1',
        accessPackage: { id: 'ap1', displayName: 'AP1', description: 'desc' },
        verifiableCredentialSettings: { credentialTypes: [] },
      },
    ]
    const service = createService(policies)
    const result = await service.findAccessPackages(['A'])
    expect(result).toHaveLength(0)
  })

  it('returns empty if no policies', async () => {
    const service = createService([])
    const result = await service.findAccessPackages(['A'])
    expect(result).toHaveLength(0)
  })
})
