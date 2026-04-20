import { IdentityEntity } from '../features/identity/entities/identity-entity'
/**
 * Common database and service mocks for shield permission tests.
 * These mocks prevent tests from hitting the database while testing authorization rules.
 *
 * Usage:
 * Import this at the top of your test file BEFORE any other imports:
 * ```
 * import './test/shield-mocks'
 * ```
 */

// Mock @makerx/node-common HttpClient
jest.mock('@makerx/node-common', () => {
  const mockFunction = () => jest.fn()
  return {
    ...jest.requireActual('@makerx/node-common'),
    HttpClient: jest.fn().mockImplementation(() => ({
      get: mockFunction(),
      post: mockFunction(),
      put: mockFunction(),
      patch: mockFunction(),
      delete: mockFunction(),
    })),
  }
})

// Mock the data source and related modules
jest.mock('../data', () => {
  const createMockQueryBuilder = () => {
    const qb: any = {
      comment: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn().mockResolvedValue(null),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      getCount: jest.fn().mockResolvedValue(0),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue(null),
    }
    return qb
  }

  const mockRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findOneOrFail: jest.fn().mockResolvedValue({ id: 'mock-id' }),
    findOneBy: jest.fn().mockResolvedValue(null),
    findBy: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    create: jest.fn().mockImplementation((entity) => entity),
    createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
    count: jest.fn().mockResolvedValue(0),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    query: jest.fn().mockResolvedValue([]),
  }

  const mockManager = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findOneBy: jest.fn().mockResolvedValue(null),
    findOneOrFail: jest.fn().mockResolvedValue({ id: 'mock-id' }),
    save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    getRepository: jest.fn().mockReturnValue(mockRepository),
    transaction: jest.fn().mockImplementation(async (_level, callback) => callback(mockManager)),
    createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
    count: jest.fn().mockResolvedValue(0),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
  }

  const mockDataSource = {
    manager: mockManager,
    getRepository: jest.fn().mockReturnValue(mockRepository),
    initialize: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
    isInitialized: true,
  }

  return {
    dataSource: mockDataSource,
    entityManager: mockManager,
    ISOLATION_LEVEL: 'REPEATABLE READ',
    runInTransaction: jest.fn().mockImplementation(async (_userId, callback) => callback(mockManager)),
  }
})

// Mock context to avoid database dependencies
jest.mock('../context', () => {
  const actual = jest.requireActual('../context')
  return {
    ...actual,
    findUpdateOrCreateUser: jest.fn().mockImplementation(async (jwtPayload) => {
      const identity = new IdentityEntity()
      identity.id = jwtPayload?.oid || 'mock-user-id'
      return {
        id: identity.id,
        email: jwtPayload?.email || 'test@example.com',
        roles: jwtPayload?.roles || [],
        scopes: (jwtPayload?.scp || '').trim().split(' ').filter(Boolean),
        claims: jwtPayload || {},
        entity: identity,
      }
    }),
    findUpdateOrCreateUserEntity: jest.fn().mockImplementation(async (jwtPayload) => ({
      id: jwtPayload?.oid || 'mock-user-id',
      email: jwtPayload?.email || 'test@example.com',
    })),
  }
})

// Mock VerifiedIdAdminService
jest.mock('../services/verified-id', () => ({
  VerifiedIdAdminService: jest.fn().mockImplementation(() => ({
    createContract: jest.fn(),
    updateContract: jest.fn(),
    contracts: jest.fn(),
    contract: jest.fn().mockResolvedValue({
      id: 'test-contract-id',
      credentialTypes: ['TestCredential'],
    }),
    findNetworkIssuers: jest.fn().mockResolvedValue([
      {
        id: 'test-issuer-1',
        tenantId: 'test-tenant-1',
        name: 'Test Issuer 1',
        did: 'did:test:1234',
        linkedDomainUrls: ['https://test.com'],
        isTrusted: true,
      },
    ]),
    networkContracts: jest.fn(),
    findCredential: jest.fn(),
    revokeCredential: jest.fn(),
    authority: jest.fn(),
    findIdentityStores: jest.fn(),
    findIssuances: jest.fn(),
  })),
  VerifiedIdRequestService: jest.fn(),
}))

// Mock GraphServiceManager
jest.mock('../services/graph-service', () => ({
  graphServiceManager: {
    findAllAccessPackages: jest.fn().mockResolvedValue([
      {
        id: 'test-access-package-id',
        displayName: 'Test Access Package',
        description: 'Test Description',
        credentialTypes: ['TestCredential'],
        identityStoreName: 'Test Store',
        identityStoreId: 'test-store-id',
        policyDisplayName: 'Test Policy',
        policyDisplayDescription: 'Test Policy Description',
      },
    ]),
  },
}))

// Mock Contract Loader
jest.mock('../features/contracts/loaders', () => ({
  contractLoader: jest.fn().mockReturnValue({
    load: jest.fn().mockResolvedValue({
      id: 'test-contract-id',
      credentialTypes: ['TestCredential'],
    }),
  }),
}))
