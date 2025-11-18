import { faker } from '@faker-js/faker/locale/en'

import casual from 'casual'
import { omit } from 'lodash'
import {
  createOidcClient,
  createOidcClientInput,
  createOidcClientMutation,
  deleteOidcClientMutation,
  findOidcClientsQuery,
  oidcClientQuery,
  updateConciergeClientBrandingMutation,
  updateOidcClientMutation,
} from '.'
import { OidcApplicationType, OidcClientType } from '../../../generated/graphql'
import { UserRoles } from '../../../roles'
import {
  beforeAfterAll,
  executeOperationAnonymous,
  executeOperationAsUser,
  expectToBeDefined,
  expectUnauthorizedError,
  inTransaction,
} from '../../../test'
import { mockedServices } from '../../../test/mocks'
import { UserEntity } from '../../users/entities/user-entity'
import { portalClientId, portalClientName } from '../data'
import { OidcClientEntity } from '../entities/oidc-client-entity'

const createInput = createOidcClientInput()
const updateInput = createOidcClientInput()

describe('createOidcClient mutation', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()
  })

  it('can create a public web (default) client', async () => {
    const { data, errors } = await executeOperationAsUser(
      { query: createOidcClientMutation, variables: { input: createInput } },
      UserRoles.oidcAdmin,
    )

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.createOidcClient)

    const createOidcClient = data.createOidcClient
    expect(createOidcClient).toMatchObject(createInput)

    expect(createOidcClient.createdAt).toBeDefined()
    expect(createOidcClient.createdBy).toBeDefined()
    expect(createOidcClient.updatedBy).toBeNull()
  })

  it('can create a confidential web client', async () => {
    const confidentialInput = createOidcClientInput({ clientType: OidcClientType.Confidential, clientSecret: casual.uuid })
    const { data, errors } = await executeOperationAsUser(
      { query: createOidcClientMutation, variables: { input: confidentialInput } },
      UserRoles.oidcAdmin,
    )
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.createOidcClient)
    const createOidcClient = data.createOidcClient

    expect(createOidcClient).toMatchObject(omit(confidentialInput, 'clientSecret'))
    expect(createOidcClient.clientType).toEqual(OidcClientType.Confidential)
    expect(mockedServices.oidcSecretService.set.lastCallArgs()).toEqual([createOidcClient.id, confidentialInput.clientSecret])
  })

  it('can update a confidential web client to public', async () => {
    const confidentialInput = createOidcClientInput({ clientType: OidcClientType.Confidential, clientSecret: casual.uuid })
    const { data, errors } = await executeOperationAsUser(
      { query: createOidcClientMutation, variables: { input: confidentialInput } },
      UserRoles.oidcAdmin,
    )
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.createOidcClient)
    const createOidcClient = data.createOidcClient

    expect(createOidcClient).toMatchObject(omit(confidentialInput, 'clientSecret'))
    expect(createOidcClient.clientType).toEqual(OidcClientType.Confidential)
    expect(mockedServices.oidcSecretService.set.lastCallArgs()).toEqual([createOidcClient.id, confidentialInput.clientSecret])

    // update to public client
    const publicInput = createOidcClientInput({ clientType: OidcClientType.Public })
    const { data: updateData, errors: updateErrors } = await executeOperationAsUser(
      { query: updateOidcClientMutation, variables: { id: createOidcClient.id, input: publicInput } },
      UserRoles.oidcAdmin,
    )
    expect(updateErrors).toBeUndefined()
    expectToBeDefined(updateData?.updateOidcClient)
    const updatedOidcClient = updateData.updateOidcClient
    expect(updatedOidcClient).toMatchObject(omit(publicInput, 'clientSecret'))
    expect(updatedOidcClient.clientType).toEqual(OidcClientType.Public)
    // client secret should be deleted
    expect(mockedServices.oidcSecretService.delete.lastCallArgs()).toEqual([updatedOidcClient.id])
  })

  it(`can't create a confidential client without a secret`, async () => {
    const confidentialInput = createOidcClientInput({ clientType: OidcClientType.Confidential, clientSecret: undefined })

    const { data, errors } = await executeOperationAsUser(
      { query: createOidcClientMutation, variables: { input: confidentialInput } },
      UserRoles.oidcAdmin,
    )
    expect(data?.createOidcClient).toBeUndefined()
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toEqual('Confidential clients must have a secret')
  })

  it(`can't update a public client to confidential without a secret`, async () => {
    const publicInput = createOidcClientInput({ clientType: OidcClientType.Public })
    const { data: createData } = await executeOperationAsUser(
      { query: createOidcClientMutation, variables: { input: publicInput } },
      UserRoles.oidcAdmin,
    )
    expectToBeDefined(createData?.createOidcClient)
    const client = createData.createOidcClient

    const confidentialInput = createOidcClientInput({ clientType: OidcClientType.Confidential, clientSecret: undefined })
    const { data, errors } = await executeOperationAsUser(
      { query: updateOidcClientMutation, variables: { id: client.id, input: confidentialInput } },
      UserRoles.oidcAdmin,
    )

    expect(data?.updateOidcClient).toBeUndefined()
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toEqual('Confidential clients must have a secret')
  })

  it('returns an unauthorized error when accessed anonymously', async () => {
    const { errors } = await executeOperationAnonymous({ query: createOidcClientMutation, variables: { input: createInput } })
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns an unauthorized error when accessed with the wrong role', async () => {
    const { errors } = await executeOperationAsUser(
      { query: createOidcClientMutation, variables: { input: createInput } },
      UserRoles.issuer,
    )
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })
})

describe('updateOidcClient mutation', () => {
  beforeAfterAll()

  it('can update a client', async () => {
    // Arrange
    const { data: createClientData } = await createOidcClient()
    expectToBeDefined(createClientData?.createOidcClient)
    const client = createClientData?.createOidcClient

    // Act
    const { data, errors } = await executeOperationAsUser(
      { query: updateOidcClientMutation, variables: { id: client.id, input: updateInput } },
      UserRoles.oidcAdmin,
    )

    // Assert
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.updateOidcClient)
    const updateOidcClient = data.updateOidcClient

    expect(client.id).toEqual(updateOidcClient.id)
    expect(updateOidcClient).toMatchObject(updateInput)
    expect(updateOidcClient.updatedAt).toBeDefined()
    expect(updateOidcClient.updatedAt?.getTime()).toBeGreaterThan(updateOidcClient.createdAt?.getDate())
    expect(updateOidcClient.updatedBy).toBeDefined()
  })
})

async function insertConciergeOidcClient(overrides: Partial<OidcClientEntity> = {}) {
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

  const client = new OidcClientEntity({
    id: portalClientId,
    name: portalClientName,
    applicationType: OidcApplicationType.Web,
    clientType: OidcClientType.Public,
    redirectUris: ['https://example.com/cb'],
    postLogoutUris: ['https://example.com/logout'],
    ...overrides,
  })

  await inTransaction(async (em) => {
    await em.getRepository(OidcClientEntity).save(client)
  }, userId)

  return client
}
describe('updateConciergeClientBranding mutation', () => {
  beforeAfterAll()

  let initClient: OidcClientEntity

  beforeAll(async () => {
    initClient = await insertConciergeOidcClient({
      logo: 'http://www.somelogo.com/img.png',
      backgroundColor: '#fff',
      backgroundImage: 'http://www.bg.com/img.png',
    })
  })

  it('can update only the name field', async () => {
    const input = { name: 'New Concierge Name' }
    const { data, errors } = await executeOperationAsUser(
      { query: updateConciergeClientBrandingMutation, variables: { input } },
      UserRoles.oidcAdmin,
    )

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.updateConciergeClientBranding)
    const updated = data.updateConciergeClientBranding
    expect(updated.name).toEqual('New Concierge Name')
    expect(updated.logo).toEqual(initClient.logo)
    expect(updated.backgroundColor).toEqual(initClient.backgroundColor)
    expect(updated.backgroundImage).toEqual(initClient.backgroundImage)
    expect(updated.updatedAt).toBeDefined()
    expect(updated.updatedBy).toBeDefined()
  })

  it('can update only the logo field', async () => {
    const input = { logo: 'https://new.logo/image.png' }
    const { data, errors } = await executeOperationAsUser(
      { query: updateConciergeClientBrandingMutation, variables: { input } },
      UserRoles.oidcAdmin,
    )

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.updateConciergeClientBranding)
    const updated = data.updateConciergeClientBranding
    expect(updated.logo).toEqual(input.logo)
    expect(updated.name).toEqual('New Concierge Name') // previously updated
    expect(updated.backgroundColor).toEqual(initClient.backgroundColor)
    expect(updated.backgroundImage).toEqual(initClient.backgroundImage)
  })

  it('can update multiple branding fields', async () => {
    const input = {
      name: '`SomeBrand`',
      backgroundColor: '#123456',
      backgroundImage: 'https://img.com/bg.png',
    }
    const { data, errors } = await executeOperationAsUser(
      { query: updateConciergeClientBrandingMutation, variables: { input } },
      UserRoles.oidcAdmin,
    )

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.updateConciergeClientBranding)
    const updated = data.updateConciergeClientBranding
    expect(updated.name).toEqual(input.name)
    expect(updated.backgroundColor).toEqual(input.backgroundColor)
    expect(updated.backgroundImage).toEqual(input.backgroundImage)
    expect(updated.logo).toEqual('https://new.logo/image.png') // previously updated
  })

  it('resets fields to null/default when null', async () => {
    const input = {
      name: null,
      logo: null,
      backgroundColor: null,
      backgroundImage: null,
    }
    const { data, errors } = await executeOperationAsUser(
      { query: updateConciergeClientBrandingMutation, variables: { input } },
      UserRoles.oidcAdmin,
    )

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.updateConciergeClientBranding)
    const updated = data.updateConciergeClientBranding
    expect(updated.name).toBeDefined()
    expect(updated.logo).toBeNull()
    expect(updated.backgroundColor).toBeNull()
    expect(updated.backgroundImage).toBeNull()
  })

  it('does not change non-branding fields like redirectUris', async () => {
    const { data: queryData } = await executeOperationAsUser(
      { query: oidcClientQuery, variables: { id: portalClientId } },
      UserRoles.oidcAdmin,
    )
    expectToBeDefined(queryData?.oidcClient)
    const originalRedirectUris = queryData.oidcClient.redirectUris

    const input = { name: 'BrandOnly' }
    const { data, errors } = await executeOperationAsUser(
      { query: updateConciergeClientBrandingMutation, variables: { input } },
      UserRoles.oidcAdmin,
    )
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.updateConciergeClientBranding)
    const updated = data.updateConciergeClientBranding

    expect(updated.redirectUris).toEqual(originalRedirectUris)
  })

  it('returns unauthorized error for non-admin roles', async () => {
    const input = { name: 'ShouldNotWork' }
    const { errors } = await executeOperationAsUser(
      { query: updateConciergeClientBrandingMutation, variables: { input } },
      UserRoles.reader,
    )
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })
})
describe('deleteOidcClient mutation', () => {
  beforeAfterAll()

  it('can delete a client', async () => {
    // Arrange
    const { data: createClientData } = await createOidcClient()
    expectToBeDefined(createClientData?.createOidcClient)
    const client = createClientData?.createOidcClient

    // Act
    const { data, errors } = await executeOperationAsUser(
      { query: deleteOidcClientMutation, variables: { id: client.id } },
      UserRoles.oidcAdmin,
    )

    // Assert
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.deleteOidcClient)

    expect(data.deleteOidcClient.id).toEqual(client.id)
    expect(data.deleteOidcClient.deletedAt).toBeDefined()
    expect(data.deleteOidcClient.updatedBy).toBeDefined()
  })

  it('returns an unauthorized error when accessed anonymously', async () => {
    const { errors } = await executeOperationAnonymous({ query: deleteOidcClientMutation, variables: { id: '1' } })
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })
})

describe('oidcClient query', () => {
  beforeAfterAll()

  it('returns a client to anyone with read permissions', async () => {
    // Arrange
    const { data: createClientData } = await createOidcClient()
    expectToBeDefined(createClientData?.createOidcClient)
    const client = createClientData.createOidcClient

    // Act
    const { data, errors } = await executeOperationAsUser({ query: oidcClientQuery, variables: { id: client.id } }, UserRoles.reader)

    // Assert
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.oidcClient)

    const oidcClient = data.oidcClient
    expect(oidcClient).toMatchObject(omit(client, 'id'))
  })

  it('returns an error when not found', async () => {
    // Arrange
    const id = casual.uuid

    // Act
    const { data, errors } = await executeOperationAsUser({ query: oidcClientQuery, variables: { id } }, UserRoles.oidcAdmin)

    // Assert
    expect(data?.oidcClient).toBeUndefined()
    expect(errors?.[0]?.message).toEqual(`OIDC client not found: ${id}`)
  })
})

describe('findOidcClients query', () => {
  beforeAfterAll()

  it('returns a list of clients to anyone with read permission', async () => {
    // Arrange
    const { data: createClientData } = await createOidcClient()
    expectToBeDefined(createClientData?.createOidcClient)
    const client = createClientData.createOidcClient

    // Act
    const { data, errors } = await executeOperationAsUser(
      { query: findOidcClientsQuery, variables: { where: { name: client.name } } },
      UserRoles.reader,
    )

    // Assert
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.findOidcClients)

    const findOidcClients = data.findOidcClients
    expect(findOidcClients.length).toEqual(1)
    expect(findOidcClients[0]).toMatchObject(omit(client, 'id'))
  })

  it('returns an unauthorized error when accessed anonymously', async () => {
    const { errors } = await executeOperationAnonymous({ query: findOidcClientsQuery })
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns deleted clients only when asked', async () => {
    // Arrange
    const { data: createClientData } = await createOidcClient()
    expectToBeDefined(createClientData?.createOidcClient)
    const client = createClientData.createOidcClient
    await executeOperationAsUser({ query: deleteOidcClientMutation, variables: { id: client.id } }, UserRoles.oidcAdmin)

    // Act
    const { data: defaultData } = await executeOperationAsUser(
      { query: findOidcClientsQuery, variables: { where: { name: client.name } } },
      UserRoles.reader,
    )
    const { data: withDeletedData } = await executeOperationAsUser(
      { query: findOidcClientsQuery, variables: { where: { name: client.name, isDeleted: true } } },
      UserRoles.reader,
    )

    // Assert
    expect(defaultData?.findOidcClients?.length).toEqual(0)
    expect(withDeletedData?.findOidcClients?.length).toEqual(1)
    expect(withDeletedData?.findOidcClients?.[0]?.deletedAt).toBeTruthy()
  })
})
