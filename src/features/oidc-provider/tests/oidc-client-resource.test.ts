import {
  createOidcClient,
  createOidcClientResourceMutation,
  createOidcResource,
  createOidcResourceInput,
  deleteOidcClientResourceMutation,
  deleteOidcResourceMutation,
  oidcClientQuery,
  updateOidcClientResourceMutation,
  updateOidcResourceMutation,
} from '.'
import { UserRoles } from '../../../roles'
import { beforeAfterAll, executeOperationAsUser, expectToBeDefined } from '../../../test'

describe('createOidcClientResource mutation', () => {
  beforeAfterAll()

  it('can create a client resource', async () => {
    // Arrange
    const { data: createClientData } = await createOidcClient()
    expectToBeDefined(createClientData?.createOidcClient)
    const client = createClientData?.createOidcClient

    const { data: createResourceData } = await createOidcResource()
    expectToBeDefined(createResourceData?.createOidcResource)
    const resource = createResourceData?.createOidcResource

    // Act
    const { data, errors } = await executeOperationAsUser(
      {
        query: createOidcClientResourceMutation,
        variables: { clientId: client.id, input: { resourceId: resource.id, resourceScopes: resource.scopes } },
      },
      UserRoles.oidcAdmin,
    )

    // Assert
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.createOidcClientResource)
    const clientWithResource = data.createOidcClientResource

    expect(clientWithResource.id).toEqual(client.id)
    expect(clientWithResource.resources).toHaveLength(1)
    expect(clientWithResource.resources?.[0]).toMatchObject({
      resource: {
        id: resource.id,
      },
      resourceScopes: resource.scopes,
    })
  })

  it('can update a client resource', async () => {
    // Arrange
    const { data: createClientData } = await createOidcClient()
    expectToBeDefined(createClientData?.createOidcClient)
    const client = createClientData?.createOidcClient
    const { data: createResourceData } = await createOidcResource()
    expectToBeDefined(createResourceData?.createOidcResource)
    const resource = createResourceData?.createOidcResource
    const { data: addResourceData } = await executeOperationAsUser(
      {
        query: createOidcClientResourceMutation,
        variables: { clientId: client.id, input: { resourceId: resource.id, resourceScopes: resource.scopes } },
      },
      UserRoles.oidcAdmin,
    )
    expect(addResourceData?.createOidcClientResource?.resources).toHaveLength(1)

    // Act - update the resource scopes to only have one scope
    const updatedScopes = resource.scopes.slice(0, 1)
    const { data, errors } = await executeOperationAsUser(
      {
        query: updateOidcClientResourceMutation,
        variables: { clientId: client.id, input: { resourceId: resource.id, resourceScopes: updatedScopes } },
      },
      UserRoles.oidcAdmin,
    )
    expect(errors).toBeUndefined()
    expect(data?.updateOidcClientResource?.resources).toHaveLength(1)
    const clientResource = data?.updateOidcClientResource.resources?.[0]
    expectToBeDefined(clientResource)
    expect(clientResource).toMatchObject({
      resource: {
        id: resource.id,
      },
      resourceScopes: updatedScopes,
    })
  })

  it('can delete a client resource', async () => {
    // Arrange
    const { data: createClientData } = await createOidcClient()
    expectToBeDefined(createClientData?.createOidcClient)
    const client = createClientData?.createOidcClient
    const { data: createResourceData } = await createOidcResource()
    expectToBeDefined(createResourceData?.createOidcResource)
    const resource = createResourceData?.createOidcResource
    const { data: addResourceData } = await executeOperationAsUser(
      {
        query: createOidcClientResourceMutation,
        variables: { clientId: client.id, input: { resourceId: resource.id, resourceScopes: resource.scopes } },
      },
      UserRoles.oidcAdmin,
    )
    expect(addResourceData?.createOidcClientResource?.resources).toHaveLength(1)

    // Act
    const { data, errors } = await executeOperationAsUser(
      {
        query: deleteOidcClientResourceMutation,
        variables: { clientId: client.id, resourceId: resource.id },
      },
      UserRoles.oidcAdmin,
    )
    expect(errors).toBeUndefined()
    expect(data?.deleteOidcClientResource?.resources).toHaveLength(0)
  })

  it('deleting a resource removes it from clients', async () => {
    // Arrange
    const { data: createClientData } = await createOidcClient()
    expectToBeDefined(createClientData?.createOidcClient)
    const client = createClientData?.createOidcClient
    const { data: createResourceData } = await createOidcResource()
    expectToBeDefined(createResourceData?.createOidcResource)
    const resource = createResourceData?.createOidcResource
    const { data: addResourceData } = await executeOperationAsUser(
      {
        query: createOidcClientResourceMutation,
        variables: { clientId: client.id, input: { resourceId: resource.id, resourceScopes: resource.scopes } },
      },
      UserRoles.oidcAdmin,
    )
    expect(addResourceData?.createOidcClientResource?.resources).toHaveLength(1)

    // Act
    const { errors } = await executeOperationAsUser(
      { query: deleteOidcResourceMutation, variables: { id: resource.id } },
      UserRoles.oidcAdmin,
    )
    expect(errors).toBeUndefined()

    // Assert
    const { data } = await executeOperationAsUser({ query: oidcClientQuery, variables: { id: client.id } }, UserRoles.reader)
    expectToBeDefined(data?.oidcClient)
    expect(data?.oidcClient?.resources).toHaveLength(0)
  })

  it('removing resource scopes removes them from client resources', async () => {
    // Arrange
    const { data: createClientData } = await createOidcClient()
    expectToBeDefined(createClientData?.createOidcClient)
    const client = createClientData?.createOidcClient
    const resourceInput = createOidcResourceInput()
    const { data: createResourceData } = await createOidcResource(resourceInput)
    expectToBeDefined(createResourceData?.createOidcResource)
    const resource = createResourceData?.createOidcResource
    const { data: addResourceData } = await executeOperationAsUser(
      {
        query: createOidcClientResourceMutation,
        variables: { clientId: client.id, input: { resourceId: resource.id, resourceScopes: resource.scopes } },
      },
      UserRoles.oidcAdmin,
    )
    expect(addResourceData?.createOidcClientResource?.resources).toHaveLength(1)

    // Act - remove all but the first scope on the resource
    const updatedResourceScopes = resource.scopes.slice(0, 1)
    await executeOperationAsUser(
      { query: updateOidcResourceMutation, variables: { id: resource.id, input: { ...resourceInput, scopes: updatedResourceScopes } } },
      UserRoles.oidcAdmin,
    )

    // Assert - check the client resource only has the one scope
    const { data } = await executeOperationAsUser({ query: oidcClientQuery, variables: { id: client.id } }, UserRoles.reader)
    expectToBeDefined(data?.oidcClient)
    expect(data?.oidcClient?.resources).toHaveLength(1)
    expect(data?.oidcClient?.resources?.[0]?.resourceScopes).toEqual(updatedResourceScopes)
  })
})
