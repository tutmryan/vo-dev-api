import casual from 'casual'
import { omit, sortBy } from 'lodash'
import {
  createOidcClaimMapping,
  createOidcClaimMappingInput,
  createOidcClaimMappingMutation,
  createOidcClient,
  deleteOidcClaimMappingMutation,
  findOidcClaimMappingsQuery,
  oidcClaimMappingQuery,
  updateOidcClaimMappingMutation,
  updateOidcClientClaimMappingsMutation,
} from '.'
import { UserRoles } from '../../../roles'
import {
  beforeAfterAll,
  executeOperationAnonymous,
  executeOperationAsUser,
  expectToBeDefined,
  expectUnauthorizedError,
} from '../../../test'

describe('createOidcClaimMapping mutation', () => {
  beforeAfterAll()

  const createInput = createOidcClaimMappingInput()

  it('can create a mapping', async () => {
    const { errors, data } = await executeOperationAsUser(
      { query: createOidcClaimMappingMutation, variables: { input: createInput } },
      UserRoles.oidcAdmin,
    )

    expect(errors).toBeUndefined()
    expect(data?.createOidcClaimMapping).toMatchObject(createInput)
  })

  it('returns an unauthorized error when accessed anonymously', async () => {
    const { errors, data } = await executeOperationAnonymous({ query: createOidcClaimMappingMutation, variables: { input: createInput } })
    expect(data).toBeNull()
    expectUnauthorizedError(errors)
  })

  it('returns an unauthorized error when accessed with the wrong role', async () => {
    const { errors, data } = await executeOperationAsUser(
      { query: createOidcClaimMappingMutation, variables: { input: createInput } },
      UserRoles.reader,
    )
    expect(data).toBeNull()
    expectUnauthorizedError(errors)
  })

  it('returns an error when duplicate claims are provided', async () => {
    // Arrange
    const input = createOidcClaimMappingInput({
      mappings: [
        { scope: 'scope1', claim: 'claim1', credentialClaim: 'credentialClaim1' },
        { scope: 'scope2', claim: 'claim1', credentialClaim: 'credentialClaim2' }, // Duplicate claim
      ],
    })

    // Act
    const { errors, data } = await executeOperationAsUser(
      { query: createOidcClaimMappingMutation, variables: { input } },
      UserRoles.oidcAdmin,
    )

    // Assert
    expect(data).toBeNull()
    expect(errors?.[0]?.message).toMatchInlineSnapshot(`"Duplicate claim "claim1" found in scoped mappings"`)
  })
})

describe('updateOidcClaimMapping mutation', () => {
  beforeAfterAll()

  it('can update a mapping', async () => {
    // Arrange
    const { data: createResourceData } = await executeOperationAsUser(
      { query: createOidcClaimMappingMutation, variables: { input: createOidcClaimMappingInput() } },
      UserRoles.oidcAdmin,
    )
    expectToBeDefined(createResourceData?.createOidcClaimMapping)
    const mapping = createResourceData?.createOidcClaimMapping

    // Act
    const updateInput = createOidcClaimMappingInput()
    const { data, errors } = await executeOperationAsUser(
      { query: updateOidcClaimMappingMutation, variables: { id: mapping.id, input: updateInput } },
      UserRoles.oidcAdmin,
    )

    // Assert
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.updateOidcClaimMapping)
    const updateOidcClaimMapping = data.updateOidcClaimMapping

    expect(mapping.id).toEqual(updateOidcClaimMapping.id)
    expect(updateOidcClaimMapping).toMatchObject(updateInput)
    expect(updateOidcClaimMapping.updatedAt).toBeDefined()
    expect(updateOidcClaimMapping.updatedAt?.getTime()).toBeGreaterThan(updateOidcClaimMapping.createdAt?.getDate())
    expect(updateOidcClaimMapping.updatedBy).toBeDefined()
  })
})

describe('oidcClaimMapping query', () => {
  beforeAfterAll()

  it('returns a mapping to anyone with read permissions', async () => {
    // Arrange
    const { data: createResourceData } = await createOidcClaimMapping()
    expectToBeDefined(createResourceData?.createOidcClaimMapping)
    const mapping = createResourceData.createOidcClaimMapping

    // Act
    const { data, errors } = await executeOperationAsUser({ query: oidcClaimMappingQuery, variables: { id: mapping.id } }, UserRoles.reader)

    // Assert
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.oidcClaimMapping)

    const oidcClaimMapping = data.oidcClaimMapping
    expect(oidcClaimMapping).toMatchObject(omit(mapping, 'id'))
  })

  it('returns an error when not found', async () => {
    // Arrange
    const id = casual.uuid

    // Act
    const { data, errors } = await executeOperationAsUser({ query: oidcClaimMappingQuery, variables: { id } }, UserRoles.oidcAdmin)

    // Assert
    expect(data?.oidcClaimMapping).toBeUndefined()
    expect(errors?.[0]?.message).toEqual(`OIDC claim mapping not found: ${id}`)
  })
})

describe('findOidcClaimMappings query', () => {
  beforeAfterAll()

  it('returns a list of mappings to anyone with read permission', async () => {
    // Arrange
    const { data: createResourceData } = await createOidcClaimMapping()
    expectToBeDefined(createResourceData?.createOidcClaimMapping)
    const mapping = createResourceData.createOidcClaimMapping

    // Act
    const { data, errors } = await executeOperationAsUser(
      { query: findOidcClaimMappingsQuery, variables: { where: { name: mapping.name } } },
      UserRoles.reader,
    )

    // Assert
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.findOidcClaimMappings)

    const findOidcClaimMappings = data.findOidcClaimMappings
    expect(findOidcClaimMappings.length).toEqual(1)
    expect(findOidcClaimMappings[0]).toMatchObject(omit(mapping, 'id'))
  })

  it('returns an unauthorized error when accessed anonymously', async () => {
    const { errors } = await executeOperationAnonymous({ query: findOidcClaimMappingsQuery })
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns deleted mappings only when asked', async () => {
    // Arrange
    const { data: createResourceData } = await createOidcClaimMapping()
    expectToBeDefined(createResourceData?.createOidcClaimMapping)
    const mapping = createResourceData.createOidcClaimMapping
    await executeOperationAsUser({ query: deleteOidcClaimMappingMutation, variables: { id: mapping.id } }, UserRoles.oidcAdmin)

    // Act
    const { data: defaultData } = await executeOperationAsUser(
      { query: findOidcClaimMappingsQuery, variables: { where: { name: mapping.name } } },
      UserRoles.reader,
    )
    const { data: withDeletedData } = await executeOperationAsUser(
      { query: findOidcClaimMappingsQuery, variables: { where: { name: mapping.name, isDeleted: true } } },
      UserRoles.reader,
    )

    // Assert
    expect(defaultData?.findOidcClaimMappings?.length).toEqual(0)
    expect(withDeletedData?.findOidcClaimMappings?.length).toEqual(1)
    expect(withDeletedData?.findOidcClaimMappings?.[0]?.deletedAt).toBeTruthy()
  })
})

describe('updateOidcClientClaimMappings mutation', () => {
  beforeAfterAll()

  it('updates the claim mappings for a client', async () => {
    // Arrange
    const { data: createClientData } = await createOidcClient()
    expectToBeDefined(createClientData?.createOidcClient)
    const { data: createClaimMappingData } = await createOidcClaimMapping()
    expectToBeDefined(createClaimMappingData?.createOidcClaimMapping)
    const mapping = createClaimMappingData.createOidcClaimMapping

    const updateInput = {
      clientId: createClientData.createOidcClient.id,
      claimMappingIds: [mapping.id],
    }

    // Act
    const { data, errors } = await executeOperationAsUser(
      { query: updateOidcClientClaimMappingsMutation, variables: updateInput },
      UserRoles.oidcAdmin,
    )

    // Assert
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.updateOidcClientClaimMappings)
    const updatedMapping = data.updateOidcClientClaimMappings

    expect(updatedMapping.id).toEqual(createClientData.createOidcClient.id)
    expect(updatedMapping.claimMappings).toHaveLength(1)
    expect(updatedMapping.claimMappings[0]).toMatchObject(mapping)
  })

  it('prevents applying conflicting claim mappings', async () => {
    // Arrange
    const { data: createClientData } = await createOidcClient()
    expectToBeDefined(createClientData?.createOidcClient)
    const { data: createClaimMapping1Data } = await createOidcClaimMapping({
      credentialTypes: ['type1'],
      mappings: [{ scope: 'scope1', claim: 'claim1', credentialClaim: 'credentialClaim1' }],
    })
    expectToBeDefined(createClaimMapping1Data?.createOidcClaimMapping)
    const { data: createClaimMapping2Data } = await createOidcClaimMapping({
      credentialTypes: ['type1'],
      mappings: [{ scope: 'scope1', claim: 'claim1', credentialClaim: 'credentialClaim2' }],
    })
    expectToBeDefined(createClaimMapping2Data?.createOidcClaimMapping)

    const updateInput = {
      clientId: createClientData.createOidcClient.id,
      claimMappingIds: [createClaimMapping1Data.createOidcClaimMapping.id, createClaimMapping2Data.createOidcClaimMapping.id],
    }

    // Act
    const { data, errors } = await executeOperationAsUser(
      { query: updateOidcClientClaimMappingsMutation, variables: updateInput },
      UserRoles.oidcAdmin,
    )

    // Assert
    expect(data?.updateOidcClientClaimMappings).toBeUndefined()
    const sorted = sortBy([createClaimMapping1Data.createOidcClaimMapping, createClaimMapping2Data.createOidcClaimMapping], 'name')
    expect(errors?.[0]?.message).toMatch(
      `Claim "claim1" is mapped in multiple conflicting credential claims through mappings : ${sorted.map((m) => m.name).join(', ')}`,
    )
  })

  it('allows conflicting claim mappings when they apply to different credential types', async () => {
    // Arrange
    const { data: createClientData } = await createOidcClient()
    expectToBeDefined(createClientData?.createOidcClient)
    const { data: createClaimMapping1Data } = await createOidcClaimMapping({
      credentialTypes: ['type1'],
      mappings: [{ scope: 'scope1', claim: 'claim1', credentialClaim: 'credentialClaim1' }],
    })
    expectToBeDefined(createClaimMapping1Data?.createOidcClaimMapping)
    const { data: createClaimMapping2Data } = await createOidcClaimMapping({
      credentialTypes: ['type2'],
      mappings: [{ scope: 'scope1', claim: 'claim1', credentialClaim: 'credentialClaim2' }],
    })
    expectToBeDefined(createClaimMapping2Data?.createOidcClaimMapping)
    const updateInput = {
      clientId: createClientData.createOidcClient.id,
      claimMappingIds: [createClaimMapping1Data.createOidcClaimMapping.id, createClaimMapping2Data.createOidcClaimMapping.id],
    }
    // Act
    const { data, errors } = await executeOperationAsUser(
      { query: updateOidcClientClaimMappingsMutation, variables: updateInput },
      UserRoles.oidcAdmin,
    )
    // Assert
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.updateOidcClientClaimMappings)
    expect(data.updateOidcClientClaimMappings.claimMappings).toHaveLength(2)
  })
})
