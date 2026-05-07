import { faker } from '@faker-js/faker/locale/en'
import casual from 'casual'
import { omit } from 'lodash'
import {
  createOidcClient,
  createOidcIdentityResolver,
  createOidcIdentityResolverInput,
  createOidcIdentityResolverMutation,
  deleteOidcIdentityResolverMutation,
  findOidcIdentityResolversQuery,
  oidcIdentityResolverQuery,
  updateOidcClientIdentityResolversMutation,
  updateOidcIdentityResolverMutation,
} from '.'
import { IdentityStoreType, OidcIdentityLookupType } from '../../../generated/graphql'
import { UserRoles } from '../../../roles'
import {
  beforeAfterAll,
  executeOperationAnonymous,
  executeOperationAsUser,
  expectToBeDefined,
  expectUnauthorizedError,
  inTransaction,
} from '../../../test'
import { IdentityStoreEntity } from '../../identity-store/entities/identity-store-entity'
import { UserEntity } from '../../users/entities/user-entity'
import { OidcIdentityResolverEntity } from '../entities/oidc-identity-resolver-entity'

async function insertMockIdentityStore(overrides?: Partial<IdentityStoreEntity>) {
  const id = faker.string.uuid()
  const userId = faker.string.uuid()

  await inTransaction(async (em) => {
    await em.getRepository(UserEntity).save({
      id: userId,
      oid: faker.string.uuid(),
      tenantId: faker.string.uuid(),
      email: 'test@example.com',
      name: 'Test User',
      isApp: false,
    })
  }, userId)

  const store = new IdentityStoreEntity({
    identifier: overrides?.identifier ?? faker.string.uuid(),
    name: overrides?.name ?? 'Test Store',
    type: overrides?.type ?? IdentityStoreType.Entra,
    isAuthenticationEnabled: overrides?.isAuthenticationEnabled ?? false,
    clientId: overrides?.clientId,
  })

  store.id = id

  await inTransaction(async (em) => {
    await em.getRepository(IdentityStoreEntity).save(store)
  }, userId)

  return store
}

describe('createOidcIdentityResolver mutation', () => {
  beforeAfterAll()

  let identityStoreId: string

  beforeAll(async () => {
    const store = await insertMockIdentityStore()
    identityStoreId = store.id
  })

  it('can create an identity resolver', async () => {
    const input = createOidcIdentityResolverInput(identityStoreId)
    const { data, errors } = await executeOperationAsUser(
      { query: createOidcIdentityResolverMutation, variables: { input } },
      UserRoles.oidcAdmin,
    )

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.createOidcIdentityResolver)

    const resolver = data.createOidcIdentityResolver
    expect(resolver.name).toEqual(input.name)
    expect(resolver.claimName).toEqual(input.claimName)
    expect(resolver.credentialTypes).toEqual(input.credentialTypes)
    expect(resolver.lookupType).toEqual(input.lookupType)
    expect(resolver.identityStoreType).toEqual(IdentityStoreType.Entra)
    expect(resolver.identityStore.id).toEqual(identityStoreId)
    expect(resolver.createdAt).toBeDefined()
    expect(resolver.createdBy).toBeDefined()
    expect(resolver.updatedBy).toBeNull()
  })

  it('can create an identity resolver with all lookup types', async () => {
    for (const lookupType of [OidcIdentityLookupType.Email, OidcIdentityLookupType.ObjectId, OidcIdentityLookupType.UserPrincipalName]) {
      const input = createOidcIdentityResolverInput(identityStoreId, { lookupType })
      const { data, errors } = await executeOperationAsUser(
        { query: createOidcIdentityResolverMutation, variables: { input } },
        UserRoles.oidcAdmin,
      )

      expect(errors).toBeUndefined()
      expectToBeDefined(data?.createOidcIdentityResolver)
      expect(data.createOidcIdentityResolver.lookupType).toEqual(lookupType)
    }
  })

  it('can create an identity resolver without credential types', async () => {
    const input = createOidcIdentityResolverInput(identityStoreId, { credentialTypes: undefined })
    const { data, errors } = await executeOperationAsUser(
      { query: createOidcIdentityResolverMutation, variables: { input } },
      UserRoles.oidcAdmin,
    )

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.createOidcIdentityResolver)
    expect(data.createOidcIdentityResolver.credentialTypes).toBeNull()
  })

  it('fails for non-Entra identity stores', async () => {
    const nonEntraStore = await insertMockIdentityStore({ type: IdentityStoreType.Manual })
    const input = createOidcIdentityResolverInput(nonEntraStore.id)

    const { data, errors } = await executeOperationAsUser(
      { query: createOidcIdentityResolverMutation, variables: { input } },
      UserRoles.oidcAdmin,
    )

    expect(data?.createOidcIdentityResolver).toBeUndefined()
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toContain('Only Entra identity stores are supported')
  })

  it('returns an unauthorized error when accessed anonymously', async () => {
    const input = createOidcIdentityResolverInput(identityStoreId)
    const { errors } = await executeOperationAnonymous({ query: createOidcIdentityResolverMutation, variables: { input } })
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns an unauthorized error when accessed with the wrong role', async () => {
    const input = createOidcIdentityResolverInput(identityStoreId)
    const { errors } = await executeOperationAsUser(
      { query: createOidcIdentityResolverMutation, variables: { input } },
      UserRoles.issuer,
    )
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })
})

describe('updateOidcIdentityResolver mutation', () => {
  beforeAfterAll()

  let identityStoreId: string

  beforeAll(async () => {
    const store = await insertMockIdentityStore()
    identityStoreId = store.id
  })

  it('can update an identity resolver', async () => {
    const { data: createData } = await createOidcIdentityResolver(identityStoreId)
    expectToBeDefined(createData?.createOidcIdentityResolver)
    const resolver = createData.createOidcIdentityResolver

    const updateInput = createOidcIdentityResolverInput(identityStoreId, {
      name: 'Updated Name',
      claimName: 'updatedClaim',
      lookupType: OidcIdentityLookupType.UserPrincipalName,
    })

    const { data, errors } = await executeOperationAsUser(
      { query: updateOidcIdentityResolverMutation, variables: { id: resolver.id, input: updateInput } },
      UserRoles.oidcAdmin,
    )

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.updateOidcIdentityResolver)

    const updated = data.updateOidcIdentityResolver
    expect(updated.id).toEqual(resolver.id)
    expect(updated.name).toEqual('Updated Name')
    expect(updated.claimName).toEqual('updatedClaim')
    expect(updated.lookupType).toEqual(OidcIdentityLookupType.UserPrincipalName)
    expect(updated.updatedAt).toBeDefined()
    expect(updated.updatedBy).toBeDefined()
  })

  it('returns an unauthorized error when accessed anonymously', async () => {
    const { data: createData } = await createOidcIdentityResolver(identityStoreId)
    expectToBeDefined(createData?.createOidcIdentityResolver)
    const resolver = createData.createOidcIdentityResolver

    const updateInput = createOidcIdentityResolverInput(identityStoreId)
    const { errors } = await executeOperationAnonymous({
      query: updateOidcIdentityResolverMutation,
      variables: { id: resolver.id, input: updateInput },
    })
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })
})

describe('deleteOidcIdentityResolver mutation', () => {
  beforeAfterAll()

  let identityStoreId: string

  beforeAll(async () => {
    const store = await insertMockIdentityStore()
    identityStoreId = store.id
  })

  it('can delete an identity resolver', async () => {
    const { data: createData } = await createOidcIdentityResolver(identityStoreId)
    expectToBeDefined(createData?.createOidcIdentityResolver)
    const resolver = createData.createOidcIdentityResolver

    const { data, errors } = await executeOperationAsUser(
      { query: deleteOidcIdentityResolverMutation, variables: { id: resolver.id } },
      UserRoles.oidcAdmin,
    )

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.deleteOidcIdentityResolver)

    expect(data.deleteOidcIdentityResolver.id).toEqual(resolver.id)
    expect(data.deleteOidcIdentityResolver.deletedAt).toBeDefined()
    expect(data.deleteOidcIdentityResolver.updatedBy).toBeDefined()
  })

  it('returns an unauthorized error when accessed anonymously', async () => {
    const { errors } = await executeOperationAnonymous({ query: deleteOidcIdentityResolverMutation, variables: { id: '1' } })
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })
})

describe('oidcIdentityResolver query', () => {
  beforeAfterAll()

  let identityStoreId: string

  beforeAll(async () => {
    const store = await insertMockIdentityStore()
    identityStoreId = store.id
  })

  it('returns an identity resolver to anyone with read permissions', async () => {
    const { data: createData } = await createOidcIdentityResolver(identityStoreId)
    expectToBeDefined(createData?.createOidcIdentityResolver)
    const resolver = createData.createOidcIdentityResolver

    const { data, errors } = await executeOperationAsUser(
      { query: oidcIdentityResolverQuery, variables: { id: resolver.id } },
      UserRoles.reader,
    )

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.oidcIdentityResolver)

    const queried = data.oidcIdentityResolver
    expect(queried).toMatchObject(omit(resolver, 'id'))
  })

  it('returns an error when not found', async () => {
    const id = casual.uuid

    const { data, errors } = await executeOperationAsUser(
      { query: oidcIdentityResolverQuery, variables: { id } },
      UserRoles.oidcAdmin,
    )

    expect(data?.oidcIdentityResolver).toBeUndefined()
    expect(errors).toBeDefined()
  })

  it('returns an unauthorized error when accessed anonymously', async () => {
    const { errors } = await executeOperationAnonymous({ query: oidcIdentityResolverQuery, variables: { id: casual.uuid } })
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })
})

describe('findOidcIdentityResolvers query', () => {
  beforeAfterAll()

  let identityStoreId: string

  beforeAll(async () => {
    const store = await insertMockIdentityStore()
    identityStoreId = store.id
  })

  it('returns a list of identity resolvers to anyone with read permission', async () => {
    const { data: createData } = await createOidcIdentityResolver(identityStoreId)
    expectToBeDefined(createData?.createOidcIdentityResolver)
    const resolver = createData.createOidcIdentityResolver

    const { data, errors } = await executeOperationAsUser(
      { query: findOidcIdentityResolversQuery, variables: { where: { name: resolver.name } } },
      UserRoles.reader,
    )

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.findOidcIdentityResolvers)

    const found = data.findOidcIdentityResolvers
    expect(found.length).toEqual(1)
    expect(found[0]).toMatchObject(omit(resolver, 'id'))
  })

  it('can filter by identity store id', async () => {
    const { data: createData } = await createOidcIdentityResolver(identityStoreId)
    expectToBeDefined(createData?.createOidcIdentityResolver)
    const resolver = createData.createOidcIdentityResolver

    const { data, errors } = await executeOperationAsUser(
      { query: findOidcIdentityResolversQuery, variables: { where: { identityStoreId } } },
      UserRoles.reader,
    )

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.findOidcIdentityResolvers)

    const found = data.findOidcIdentityResolvers
    expect(found.some((r) => r.id === resolver.id)).toBeTruthy()
  })

  it('can filter by identity store type', async () => {
    const { data: createData } = await createOidcIdentityResolver(identityStoreId)
    expectToBeDefined(createData?.createOidcIdentityResolver)
    const resolver = createData.createOidcIdentityResolver

    const { data, errors } = await executeOperationAsUser(
      { query: findOidcIdentityResolversQuery, variables: { where: { identityStoreType: IdentityStoreType.Entra } } },
      UserRoles.reader,
    )

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.findOidcIdentityResolvers)

    const found = data.findOidcIdentityResolvers
    expect(found.some((r) => r.id === resolver.id)).toBeTruthy()
  })

  it('returns an unauthorized error when accessed anonymously', async () => {
    const { errors } = await executeOperationAnonymous({ query: findOidcIdentityResolversQuery })
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns deleted identity resolvers only when asked', async () => {
    const { data: createData } = await createOidcIdentityResolver(identityStoreId)
    expectToBeDefined(createData?.createOidcIdentityResolver)
    const resolver = createData.createOidcIdentityResolver

    await executeOperationAsUser({ query: deleteOidcIdentityResolverMutation, variables: { id: resolver.id } }, UserRoles.oidcAdmin)

    const { data: defaultData } = await executeOperationAsUser(
      { query: findOidcIdentityResolversQuery, variables: { where: { name: resolver.name } } },
      UserRoles.reader,
    )
    const { data: withDeletedData } = await executeOperationAsUser(
      { query: findOidcIdentityResolversQuery, variables: { where: { name: resolver.name, isDeleted: true } } },
      UserRoles.reader,
    )

    expect(defaultData?.findOidcIdentityResolvers?.length).toEqual(0)
    expect(withDeletedData?.findOidcIdentityResolvers?.length).toEqual(1)
    expect(withDeletedData?.findOidcIdentityResolvers?.[0]?.deletedAt).toBeTruthy()
  })
})

describe('updateOidcClientIdentityResolvers mutation', () => {
  beforeAfterAll()

  let identityStoreId: string

  beforeAll(async () => {
    const store = await insertMockIdentityStore()
    identityStoreId = store.id
  })

  it('can associate identity resolvers with a client', async () => {
    const { data: createClientData } = await createOidcClient()
    expectToBeDefined(createClientData?.createOidcClient)
    const client = createClientData.createOidcClient

    const { data: resolver1Data } = await createOidcIdentityResolver(identityStoreId)
    const { data: resolver2Data } = await createOidcIdentityResolver(identityStoreId)
    expectToBeDefined(resolver1Data?.createOidcIdentityResolver)
    expectToBeDefined(resolver2Data?.createOidcIdentityResolver)

    const resolver1 = resolver1Data.createOidcIdentityResolver
    const resolver2 = resolver2Data.createOidcIdentityResolver

    const { data, errors } = await executeOperationAsUser(
      {
        query: updateOidcClientIdentityResolversMutation,
        variables: { clientId: client.id, identityResolverIds: [resolver1.id, resolver2.id] },
      },
      UserRoles.oidcAdmin,
    )

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.updateOidcClientIdentityResolvers)

    const updated = data.updateOidcClientIdentityResolvers
    expect(updated.identityResolvers).toHaveLength(2)
    expect(updated.identityResolvers.map((r) => r.id)).toEqual(expect.arrayContaining([resolver1.id, resolver2.id]))
  })

  it('can update client identity resolvers to empty list', async () => {
    const { data: createClientData } = await createOidcClient()
    expectToBeDefined(createClientData?.createOidcClient)
    const client = createClientData.createOidcClient

    const { data: resolverData } = await createOidcIdentityResolver(identityStoreId)
    expectToBeDefined(resolverData?.createOidcIdentityResolver)

    await executeOperationAsUser(
      {
        query: updateOidcClientIdentityResolversMutation,
        variables: { clientId: client.id, identityResolverIds: [resolverData.createOidcIdentityResolver.id] },
      },
      UserRoles.oidcAdmin,
    )

    const { data, errors } = await executeOperationAsUser(
      {
        query: updateOidcClientIdentityResolversMutation,
        variables: { clientId: client.id, identityResolverIds: [] },
      },
      UserRoles.oidcAdmin,
    )

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.updateOidcClientIdentityResolvers)
    expect(data.updateOidcClientIdentityResolvers.identityResolvers).toHaveLength(0)
  })

  it('persists identity resolver association in database', async () => {
    const { data: createClientData } = await createOidcClient()
    expectToBeDefined(createClientData?.createOidcClient)
    const client = createClientData.createOidcClient

    const { data: resolverData } = await createOidcIdentityResolver(identityStoreId)
    expectToBeDefined(resolverData?.createOidcIdentityResolver)
    const resolver = resolverData.createOidcIdentityResolver

    await executeOperationAsUser(
      {
        query: updateOidcClientIdentityResolversMutation,
        variables: { clientId: client.id, identityResolverIds: [resolver.id] },
      },
      UserRoles.oidcAdmin,
    )

    const reloaded = await inTransaction((em) =>
      em.getRepository(OidcIdentityResolverEntity).find({
        where: { id: resolver.id },
      }),
    )

    expect(reloaded).toHaveLength(1)
    expect(reloaded[0]?.id).toEqual(resolver.id)
  })

  it('returns an unauthorized error when accessed anonymously', async () => {
    const { errors } = await executeOperationAnonymous({
      query: updateOidcClientIdentityResolversMutation,
      variables: { clientId: casual.uuid, identityResolverIds: [] },
    })
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns an unauthorized error when accessed with the wrong role', async () => {
    const { errors } = await executeOperationAsUser(
      {
        query: updateOidcClientIdentityResolversMutation,
        variables: { clientId: casual.uuid, identityResolverIds: [] },
      },
      UserRoles.reader,
    )
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })
})
