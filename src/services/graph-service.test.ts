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

describe('GraphService.buildFindUsersFilter', () => {
  it('builds simple startswith filter for single-token input', () => {
    const filter = GraphService.buildFindUsersFilter('Mike')
    expect(filter).toBe("startswith(displayName,'Mike') or startswith(givenName,'Mike') or startswith(surname,'Mike')")
  })

  it('builds filter with per-token givenName/surname clauses for multi-part input', () => {
    const filter = GraphService.buildFindUsersFilter('Mike J')
    expect(filter).toBe(
      "(startswith(displayName,'Mike%20J') or startswith(givenName,'Mike%20J') or startswith(surname,'Mike%20J')) or (startswith(givenName,'Mike') or startswith(surname,'Mike')) or (startswith(givenName,'J') or startswith(surname,'J'))",
    )
  })

  it('builds filter with per-token givenName/surname clauses for full two-part name', () => {
    const filter = GraphService.buildFindUsersFilter('Mike Jordan')
    expect(filter).toBe(
      "(startswith(displayName,'Mike%20Jordan') or startswith(givenName,'Mike%20Jordan') or startswith(surname,'Mike%20Jordan')) or (startswith(givenName,'Mike') or startswith(surname,'Mike')) or (startswith(givenName,'Jordan') or startswith(surname,'Jordan'))",
    )
  })

  it('handles three-part names with one per-token givenName/surname clause each', () => {
    const filter = GraphService.buildFindUsersFilter('Mary Jane Watson')
    expect(filter).toContain("startswith(givenName,'Mary') or startswith(surname,'Mary')")
    expect(filter).toContain("startswith(givenName,'Jane') or startswith(surname,'Jane')")
    expect(filter).toContain("startswith(givenName,'Watson') or startswith(surname,'Watson')")
    expect(filter).not.toContain(' and ')
  })

  it('includes per-token givenName/surname clauses allowing skipped-word searches (e.g. Ranil Silva finds Ranil De Silva)', () => {
    const filter = GraphService.buildFindUsersFilter('Ranil Silva')
    expect(filter).toContain("startswith(givenName,'Ranil') or startswith(surname,'Ranil')")
    expect(filter).toContain("startswith(givenName,'Silva') or startswith(surname,'Silva')")
  })

  it('escapes single quotes in input', () => {
    const filter = GraphService.buildFindUsersFilter("O'Brien")
    expect(filter).toBe("startswith(displayName,'O''Brien') or startswith(givenName,'O''Brien') or startswith(surname,'O''Brien')")
  })

  it('returns base filter for empty string', () => {
    const filter = GraphService.buildFindUsersFilter('')
    expect(filter).toBe("startswith(displayName,'') or startswith(givenName,'') or startswith(surname,'')")
  })

  it('inverted-name searches work via per-token clauses + in-memory post-filter', () => {
    const filter = GraphService.buildFindUsersFilter('Mike J')

    // Each token can match either givenName or surname — inverted names handled by matchesAllSearchTokens
    expect(filter).toContain("startswith(givenName,'Mike') or startswith(surname,'Mike')")
    expect(filter).toContain("startswith(givenName,'J') or startswith(surname,'J')")
    expect(filter).not.toContain(' and ')
  })

  it('single-token search is unchanged - no cross-match added', () => {
    const filter = GraphService.buildFindUsersFilter('Mike')

    expect(filter).not.toContain(' and ')
    expect(filter).toBe("startswith(displayName,'Mike') or startswith(givenName,'Mike') or startswith(surname,'Mike')")
  })

  it('generates one per-token clause per token for three-part compound surname name', () => {
    const filter = GraphService.buildFindUsersFilter('Will Van Beck')

    expect(filter).toContain("startswith(givenName,'Will') or startswith(surname,'Will')")
    expect(filter).toContain("startswith(givenName,'Van') or startswith(surname,'Van')")
    expect(filter).toContain("startswith(givenName,'Beck') or startswith(surname,'Beck')")
    expect(filter).not.toContain(' and ')
  })

  it('generates one per-token clause per token for four-part compound surname name', () => {
    const filter = GraphService.buildFindUsersFilter('Will Van Den Beck')

    expect(filter).toContain("startswith(givenName,'Will') or startswith(surname,'Will')")
    expect(filter).toContain("startswith(givenName,'Van') or startswith(surname,'Van')")
    expect(filter).toContain("startswith(givenName,'Den') or startswith(surname,'Den')")
    expect(filter).toContain("startswith(givenName,'Beck') or startswith(surname,'Beck')")
    expect(filter).not.toContain(' and ')
  })

  it('normalizes leading, trailing, and repeated whitespace', () => {
    const filter = GraphService.buildFindUsersFilter('  Mike   J  ')
    const expected = GraphService.buildFindUsersFilter('Mike J')
    expect(filter).toBe(expected)
  })
})

describe('GraphService.matchesAllSearchTokens', () => {
  const ranilDeSilva = { displayName: 'Ranil De Silva', givenName: 'Ranil', surname: 'De Silva' }
  const willVanBeck = { displayName: 'Will Van Beck', givenName: 'Will', surname: 'Van Beck' }

  const tokens = (s: string) =>
    s
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => t.toLowerCase())

  it('returns true when all search tokens are prefixes of name tokens', () => {
    expect(GraphService.matchesAllSearchTokens(ranilDeSilva, tokens('Ranil De Silva'))).toBe(true)
  })

  it('returns false when a search token matches no name token', () => {
    expect(GraphService.matchesAllSearchTokens(ranilDeSilva, tokens('Ranil De Silva Jr'))).toBe(false)
  })

  it('returns true for a partial-prefix search token', () => {
    expect(GraphService.matchesAllSearchTokens(ranilDeSilva, tokens('Ran De'))).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(GraphService.matchesAllSearchTokens(ranilDeSilva, tokens('ranil de silva'))).toBe(true)
  })

  it('returns true for empty search input', () => {
    expect(GraphService.matchesAllSearchTokens(ranilDeSilva, tokens(''))).toBe(true)
  })

  it('returns true when surname has compound tokens and all are matched', () => {
    expect(GraphService.matchesAllSearchTokens(willVanBeck, tokens('Will Van Beck'))).toBe(true)
  })

  it('returns false when an unrecognised token is added to a compound surname search', () => {
    expect(GraphService.matchesAllSearchTokens(willVanBeck, tokens('Will Van Beck Jr'))).toBe(false)
  })

  it('returns true when only a subset of name tokens is searched', () => {
    expect(GraphService.matchesAllSearchTokens(willVanBeck, tokens('Van Beck'))).toBe(true)
  })

  it('returns true when a search token is a substring within a name token (fuzzy)', () => {
    const tomWaitsJr = { displayName: 'Tom Waits Jr', givenName: 'Tom', surname: 'Waits Jr' }
    expect(GraphService.matchesAllSearchTokens(tomWaitsJr, tokens('To Wa its'))).toBe(true)
  })

  it('returns false when a search token is not a substring of any name token', () => {
    const tomWaitsJr = { displayName: 'Tom Waits Jr', givenName: 'Tom', surname: 'Waits Jr' }
    expect(GraphService.matchesAllSearchTokens(tomWaitsJr, tokens('Tom Waits xyz'))).toBe(false)
  })
})
