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

// ─────────────────────────────────────────────────────────────────────────────
// GraphService.testConnection
// ─────────────────────────────────────────────────────────────────────────────

describe('GraphService.testConnection', () => {
  const baseConfig: GraphServiceConfig = {
    identityStoreId: 'store1',
    tenantName: 'tenant1',
    auth: { tenantId: 'tid', clientId: 'cid', clientSecret: 'secret' },
  }

  it('returns undefined when the token fetch succeeds', async () => {
    const service = new GraphService(baseConfig)
    jest.spyOn(service['credential'](), 'getToken').mockResolvedValue({ token: 'tok', expiresOnTimestamp: 0 } as any)
    const result = await service.testConnection()
    expect(result).toBeUndefined()
  })

  it('returns MsGraphFailure with the error message when the token fetch fails', async () => {
    const service = new GraphService(baseConfig)
    jest.spyOn(service['credential'](), 'getToken').mockRejectedValue(new Error('invalid_client'))
    const result = await service.testConnection()
    expect(result).toMatchObject({
      identityStoreId: 'store1',
      error: 'invalid_client',
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GraphService.checkCapabilities
// ─────────────────────────────────────────────────────────────────────────────

describe('GraphService.checkCapabilities', () => {
  const baseConfig: GraphServiceConfig = {
    identityStoreId: 'store1',
    tenantName: 'tenant1',
    auth: { tenantId: 'tid', clientId: 'cid', clientSecret: 'secret' },
  }

  function buildJwtPayload(roles: string[]): string {
    const payload = Buffer.from(JSON.stringify({ roles })).toString('base64')
    return `header.${payload}.sig`
  }

  function createServiceWithRoles(roles: string[], apResult: AccessPackageAssignmentPolicy[] | 'missing_permissions') {
    const service = new GraphService(baseConfig)
    jest.spyOn(service['credential'](), 'getToken').mockResolvedValue({ token: buildJwtPayload(roles), expiresOnTimestamp: 0 } as any)
    jest.spyOn(service, 'getAccessPackageAssignmentPolicies').mockResolvedValue(apResult)
    return service
  }

  it('returns all-false when isConfigured is false', async () => {
    const service = new GraphService({
      ...baseConfig,
      auth: { tenantId: '', clientId: '', clientSecret: '' },
    })
    const caps = await service.checkCapabilities()
    expect(caps).toEqual({ tapWrite: false, tapPolicyInsight: false, accessPackages: false })
  })

  it('returns tapWrite=true when UserAuthMethod-TAP.ReadWrite.All role is present', async () => {
    const service = createServiceWithRoles(['UserAuthMethod-TAP.ReadWrite.All'], [])
    const caps = await service.checkCapabilities()
    expect(caps.tapWrite).toBe(true)
    expect(caps.tapPolicyInsight).toBe(false)
  })

  it('returns tapPolicyInsight=true when Policy.Read.AuthenticationMethod role is present', async () => {
    const service = createServiceWithRoles(['Policy.Read.AuthenticationMethod'], [])
    const caps = await service.checkCapabilities()
    expect(caps.tapPolicyInsight).toBe(true)
    expect(caps.tapWrite).toBe(false)
  })

  it('returns all capabilities when all required roles are present and AP permissions exist', async () => {
    const service = createServiceWithRoles(['UserAuthMethod-TAP.ReadWrite.All', 'Policy.Read.AuthenticationMethod'], [])
    const caps = await service.checkCapabilities()
    expect(caps).toEqual({ tapWrite: true, tapPolicyInsight: true, accessPackages: true })
  })

  it('returns accessPackages=false when AP permissions are missing', async () => {
    const service = createServiceWithRoles(['UserAuthMethod-TAP.ReadWrite.All', 'Policy.Read.AuthenticationMethod'], 'missing_permissions')
    const caps = await service.checkCapabilities()
    expect(caps.accessPackages).toBe(false)
  })

  it('returns all-false when no roles are granted', async () => {
    const service = createServiceWithRoles([], 'missing_permissions')
    const caps = await service.checkCapabilities()
    expect(caps).toEqual({ tapWrite: false, tapPolicyInsight: false, accessPackages: false })
  })
})

