import casual from 'casual'
import { omit } from 'lodash'
import {
  createOidcResource,
  createOidcResourceInput,
  createOidcResourceMutation,
  deleteOidcResourceMutation,
  findOidcResourcesQuery,
  oidcResourceQuery,
  updateOidcResourceMutation,
} from '.'
import { UserRoles } from '../../../roles'
import {
  beforeAfterAll,
  executeOperationAnonymous,
  executeOperationAsUser,
  expectToBeDefined,
  expectUnauthorizedError,
} from '../../../test'

describe('createOidcResource mutation', () => {
  beforeAfterAll()

  const createInput = createOidcResourceInput()

  it('can create a resource', async () => {
    const { errors, data } = await executeOperationAsUser(
      { query: createOidcResourceMutation, variables: { input: createInput } },
      UserRoles.oidcAdmin,
    )

    expect(errors).toBeUndefined()
    expect(data?.createOidcResource).toMatchObject(createInput)
  })

  it('returns an unauthorized error when accessed anonymously', async () => {
    const { errors, data } = await executeOperationAnonymous({ query: createOidcResourceMutation, variables: { input: createInput } })
    expect(data).toBeNull()
    expectUnauthorizedError(errors)
  })

  it('returns an unauthorized error when accessed with the wrong role', async () => {
    const { errors, data } = await executeOperationAsUser(
      { query: createOidcResourceMutation, variables: { input: createInput } },
      UserRoles.reader,
    )
    expect(data).toBeNull()
    expectUnauthorizedError(errors)
  })
})

describe('updateOidcResource mutation', () => {
  beforeAfterAll()

  it('can update a resource', async () => {
    // Arrange
    const { data: createResourceData } = await executeOperationAsUser(
      { query: createOidcResourceMutation, variables: { input: createOidcResourceInput() } },
      UserRoles.oidcAdmin,
    )
    expectToBeDefined(createResourceData?.createOidcResource)
    const resource = createResourceData?.createOidcResource

    // Act
    const updateInput = createOidcResourceInput()
    const { data, errors } = await executeOperationAsUser(
      { query: updateOidcResourceMutation, variables: { id: resource.id, input: updateInput } },
      UserRoles.oidcAdmin,
    )

    // Assert
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.updateOidcResource)
    const updateOidcResource = data.updateOidcResource

    expect(resource.id).toEqual(updateOidcResource.id)
    expect(updateOidcResource).toMatchObject(updateInput)
    expect(updateOidcResource.updatedAt).toBeDefined()
    expect(updateOidcResource.updatedAt?.getTime()).toBeGreaterThan(updateOidcResource.createdAt?.getDate())
    expect(updateOidcResource.updatedBy).toBeDefined()
  })
})

describe('oidcResource query', () => {
  beforeAfterAll()

  it('returns a resource to anyone with read permissions', async () => {
    // Arrange
    const { data: createResourceData } = await createOidcResource()
    expectToBeDefined(createResourceData?.createOidcResource)
    const resource = createResourceData.createOidcResource

    // Act
    const { data, errors } = await executeOperationAsUser({ query: oidcResourceQuery, variables: { id: resource.id } }, UserRoles.reader)

    // Assert
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.oidcResource)

    const oidcResource = data.oidcResource
    expect(oidcResource).toMatchObject(omit(resource, 'id'))
  })

  it('returns an error when not found', async () => {
    // Arrange
    const id = casual.uuid

    // Act
    const { data, errors } = await executeOperationAsUser({ query: oidcResourceQuery, variables: { id } }, UserRoles.oidcAdmin)

    // Assert
    expect(data?.oidcResource).toBeUndefined()
    expect(errors?.[0]?.message).toEqual(`OIDC resource not found: ${id}`)
  })
})

describe('findOidcResources query', () => {
  beforeAfterAll()

  it('returns a list of resources to anyone with read permission', async () => {
    // Arrange
    const { data: createResourceData } = await createOidcResource()
    expectToBeDefined(createResourceData?.createOidcResource)
    const resource = createResourceData.createOidcResource

    // Act
    const { data, errors } = await executeOperationAsUser(
      { query: findOidcResourcesQuery, variables: { where: { name: resource.name } } },
      UserRoles.reader,
    )

    // Assert
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.findOidcResources)

    const findOidcResources = data.findOidcResources
    expect(findOidcResources.length).toEqual(1)
    expect(findOidcResources[0]).toMatchObject(omit(resource, 'id'))
  })

  it('returns an unauthorized error when accessed anonymously', async () => {
    const { errors } = await executeOperationAnonymous({ query: findOidcResourcesQuery })
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns deleted resources only when asked', async () => {
    // Arrange
    const { data: createResourceData } = await createOidcResource()
    expectToBeDefined(createResourceData?.createOidcResource)
    const resource = createResourceData.createOidcResource
    await executeOperationAsUser({ query: deleteOidcResourceMutation, variables: { id: resource.id } }, UserRoles.oidcAdmin)

    // Act
    const { data: defaultData } = await executeOperationAsUser(
      { query: findOidcResourcesQuery, variables: { where: { name: resource.name } } },
      UserRoles.reader,
    )
    const { data: withDeletedData } = await executeOperationAsUser(
      { query: findOidcResourcesQuery, variables: { where: { name: resource.name, isDeleted: true } } },
      UserRoles.reader,
    )

    // Assert
    expect(defaultData?.findOidcResources?.length).toEqual(0)
    expect(withDeletedData?.findOidcResources?.length).toEqual(1)
    expect(withDeletedData?.findOidcResources?.[0]?.deletedAt).toBeTruthy()
  })
})
