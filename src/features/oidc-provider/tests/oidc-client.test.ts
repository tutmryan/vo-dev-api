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
import { OidcApplicationType, OidcClientType, OidcTokenEndpointAuthMethod } from '../../../generated/graphql'
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
import { PartnerEntity } from '../../partners/entities/partner-entity'
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

  it('can create a client with partnerIds', async () => {
    const partner = await createPartner()
    const input = createOidcClientInput({ partnerIds: [partner.id] })

    const { data, errors } = await executeOperationAsUser({ query: createOidcClientMutation, variables: { input } }, UserRoles.oidcAdmin)

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.createOidcClient)

    const created = data!.createOidcClient

    // Assert via GraphQL response
    const responsePartnerIds = created.partners.map((p) => p.id)
    expect(responsePartnerIds).toContain(partner.id)

    // Assert persistence by reloading from the database
    const reloaded = await inTransaction((em) =>
      em.getRepository(OidcClientEntity).findOneOrFail({ where: { id: created.id }, relations: { partners: true } }),
    )

    const persistedPartnerIds = (await reloaded.partners).map((p) => p.id)
    expect(persistedPartnerIds).toContain(partner.id)
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

  it('can create a confidential client with private_key_jwt and inline JWKS', async () => {
    const jwks = {
      keys: [{ kty: 'RSA', n: 'test-n', e: 'AQAB', kid: 'test-key-1', use: 'sig', alg: 'RS256' }],
    }
    const input = createOidcClientInput({
      clientType: OidcClientType.Confidential,
      tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.PrivateKeyJwt,
      clientJwks: jwks,
    })
    const { data, errors } = await executeOperationAsUser({ query: createOidcClientMutation, variables: { input } }, UserRoles.oidcAdmin)
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.createOidcClient)
    const client = data.createOidcClient
    expect(client.tokenEndpointAuthMethod).toEqual(OidcTokenEndpointAuthMethod.PrivateKeyJwt)
    expect(client.clientJwks).toEqual(jwks)
    expect(client.clientJwksUri).toBeNull()
    // No secret should be stored for private_key_jwt
    expect(mockedServices.oidcSecretService.set.mock().mock.calls).toHaveLength(0)
  })

  it('can create a confidential client with private_key_jwt and JWKS URI', async () => {
    const input = createOidcClientInput({
      clientType: OidcClientType.Confidential,
      tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.PrivateKeyJwt,
      clientJwksUri: 'https://example.com/.well-known/jwks.json',
    })
    const { data, errors } = await executeOperationAsUser({ query: createOidcClientMutation, variables: { input } }, UserRoles.oidcAdmin)
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.createOidcClient)
    const client = data.createOidcClient
    expect(client.tokenEndpointAuthMethod).toEqual(OidcTokenEndpointAuthMethod.PrivateKeyJwt)
    expect(client.clientJwksUri).toEqual('https://example.com/.well-known/jwks.json')
  })

  it(`can't create a private_key_jwt client without JWKS or JWKS URI`, async () => {
    const input = createOidcClientInput({
      clientType: OidcClientType.Confidential,
      tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.PrivateKeyJwt,
    })
    const { data, errors } = await executeOperationAsUser({ query: createOidcClientMutation, variables: { input } }, UserRoles.oidcAdmin)
    expect(data?.createOidcClient).toBeUndefined()
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toEqual('private_key_jwt clients must have clientJwks or clientJwksUri')
  })

  it(`can't create a private_key_jwt client with a secret`, async () => {
    const jwks = { keys: [{ kty: 'RSA', n: 'test-n', e: 'AQAB', kid: 'test-key-1' }] }
    const input = createOidcClientInput({
      clientType: OidcClientType.Confidential,
      tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.PrivateKeyJwt,
      clientJwks: jwks,
      clientSecret: casual.uuid,
    })
    const { data, errors } = await executeOperationAsUser({ query: createOidcClientMutation, variables: { input } }, UserRoles.oidcAdmin)
    expect(data?.createOidcClient).toBeUndefined()
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toEqual('private_key_jwt clients cannot have a secret, use client_secret_post instead')
  })

  it(`can't create a client_secret_post client with JWKS`, async () => {
    const jwks = { keys: [{ kty: 'RSA', n: 'test-n', e: 'AQAB', kid: 'test-key-1' }] }
    const input = createOidcClientInput({
      clientType: OidcClientType.Confidential,
      tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.ClientSecretPost,
      clientSecret: casual.uuid,
      clientJwks: jwks,
    })
    const { data, errors } = await executeOperationAsUser({ query: createOidcClientMutation, variables: { input } }, UserRoles.oidcAdmin)
    expect(data?.createOidcClient).toBeUndefined()
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toEqual('client_secret_post clients cannot have JWKS, use private_key_jwt instead')
  })

  it(`can't create a public client with private_key_jwt`, async () => {
    const jwks = { keys: [{ kty: 'RSA', n: 'test-n', e: 'AQAB', kid: 'test-key-1' }] }
    const input = createOidcClientInput({
      clientType: OidcClientType.Public,
      tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.PrivateKeyJwt,
      clientJwks: jwks,
    })
    const { data, errors } = await executeOperationAsUser({ query: createOidcClientMutation, variables: { input } }, UserRoles.oidcAdmin)
    expect(data?.createOidcClient).toBeUndefined()
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toEqual('Public clients must use token endpoint auth method "none"')
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

  it('can update client partners via partnerIds', async () => {
    const partner1 = await createPartner()
    const partner2 = await createPartner()

    const { data: createClientData } = await createOidcClient()
    expectToBeDefined(createClientData?.createOidcClient)
    const client = createClientData!.createOidcClient

    const input = createOidcClientInput({ partnerIds: [partner1.id, partner2.id] })

    const { data, errors } = await executeOperationAsUser(
      { query: updateOidcClientMutation, variables: { id: client.id, input } },
      UserRoles.oidcAdmin,
    )

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.updateOidcClient)

    const updated = data!.updateOidcClient

    // Assert via GraphQL response
    const updatedPartnerIds = updated.partners.map((p) => p.id)
    expect(updatedPartnerIds).toEqual(expect.arrayContaining([partner1.id, partner2.id]))

    // Assert persistence by reloading from the database
    const reloaded = await inTransaction((em) =>
      em.getRepository(OidcClientEntity).findOneOrFail({ where: { id: client.id }, relations: { partners: true } }),
    )

    const persistedPartnerIds = (await reloaded.partners).map((p) => p.id)
    expect(persistedPartnerIds).toEqual(expect.arrayContaining([partner1.id, partner2.id]))
  })

  it('can switch a confidential client from client_secret_post to private_key_jwt', async () => {
    const confidentialInput = createOidcClientInput({ clientType: OidcClientType.Confidential, clientSecret: casual.uuid })
    const { data: createData } = await executeOperationAsUser(
      { query: createOidcClientMutation, variables: { input: confidentialInput } },
      UserRoles.oidcAdmin,
    )
    expectToBeDefined(createData?.createOidcClient)
    const client = createData.createOidcClient

    const jwks = { keys: [{ kty: 'RSA', n: 'test-n', e: 'AQAB', kid: 'test-key-1' }] }
    const updateInput = createOidcClientInput({
      clientType: OidcClientType.Confidential,
      tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.PrivateKeyJwt,
      clientJwks: jwks,
    })
    const { data, errors } = await executeOperationAsUser(
      { query: updateOidcClientMutation, variables: { id: client.id, input: updateInput } },
      UserRoles.oidcAdmin,
    )
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.updateOidcClient)
    const updated = data.updateOidcClient
    expect(updated.tokenEndpointAuthMethod).toEqual(OidcTokenEndpointAuthMethod.PrivateKeyJwt)
    expect(updated.clientJwks).toEqual(jwks)
    // Secret should be deleted when switching to private_key_jwt
    expect(mockedServices.oidcSecretService.delete.lastCallArgs()).toEqual([client.id])
  })

  it('can switch a confidential client from private_key_jwt to client_secret_post', async () => {
    const jwks = { keys: [{ kty: 'RSA', n: 'test-n', e: 'AQAB', kid: 'test-key-1' }] }
    const pkjInput = createOidcClientInput({
      clientType: OidcClientType.Confidential,
      tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.PrivateKeyJwt,
      clientJwks: jwks,
    })
    const { data: createData } = await executeOperationAsUser(
      { query: createOidcClientMutation, variables: { input: pkjInput } },
      UserRoles.oidcAdmin,
    )
    expectToBeDefined(createData?.createOidcClient)
    const client = createData.createOidcClient

    const newSecret = casual.uuid
    const updateInput = createOidcClientInput({
      clientType: OidcClientType.Confidential,
      tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.ClientSecretPost,
      clientSecret: newSecret,
    })
    const { data, errors } = await executeOperationAsUser(
      { query: updateOidcClientMutation, variables: { id: client.id, input: updateInput } },
      UserRoles.oidcAdmin,
    )
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.updateOidcClient)
    const updated = data.updateOidcClient
    expect(updated.tokenEndpointAuthMethod).toEqual(OidcTokenEndpointAuthMethod.ClientSecretPost)
    expect(updated.clientJwks).toBeNull()
    expect(updated.clientJwksUri).toBeNull()
    expect(mockedServices.oidcSecretService.set.lastCallArgs()).toEqual([client.id, newSecret])
  })

  it(`can't switch from private_key_jwt to client_secret_post without a secret`, async () => {
    const jwks = { keys: [{ kty: 'RSA', n: 'test-n', e: 'AQAB', kid: 'test-key-1' }] }
    const pkjInput = createOidcClientInput({
      clientType: OidcClientType.Confidential,
      tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.PrivateKeyJwt,
      clientJwks: jwks,
    })
    const { data: createData } = await executeOperationAsUser(
      { query: createOidcClientMutation, variables: { input: pkjInput } },
      UserRoles.oidcAdmin,
    )
    expectToBeDefined(createData?.createOidcClient)
    const client = createData.createOidcClient

    const updateInput = createOidcClientInput({
      clientType: OidcClientType.Confidential,
      tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.ClientSecretPost,
    })
    const { data, errors } = await executeOperationAsUser(
      { query: updateOidcClientMutation, variables: { id: client.id, input: updateInput } },
      UserRoles.oidcAdmin,
    )
    expect(data?.updateOidcClient).toBeUndefined()
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toEqual('Confidential clients must have a secret')
  })

  it('retains existing secret when updating without providing a new secret', async () => {
    const originalSecret = casual.uuid
    const confidentialInput = createOidcClientInput({
      clientType: OidcClientType.Confidential,
      clientSecret: originalSecret,
    })
    const { data: createData } = await executeOperationAsUser(
      { query: createOidcClientMutation, variables: { input: confidentialInput } },
      UserRoles.oidcAdmin,
    )
    expectToBeDefined(createData?.createOidcClient)
    const client = createData.createOidcClient

    expect(mockedServices.oidcSecretService.set.lastCallArgs()).toEqual([client.id, originalSecret])

    mockedServices.clearAllMocks()

    const updateInput = createOidcClientInput({
      clientType: OidcClientType.Confidential,
      name: 'Updated Name',
    })
    const { data, errors } = await executeOperationAsUser(
      { query: updateOidcClientMutation, variables: { id: client.id, input: updateInput } },
      UserRoles.oidcAdmin,
    )

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.updateOidcClient)
    expect(data.updateOidcClient.name).toEqual('Updated Name')

    expect(mockedServices.oidcSecretService.set.mock().mock.calls).toHaveLength(0)
    expect(mockedServices.oidcSecretService.delete.mock().mock.calls).toHaveLength(0)
  })

  it(`can't provide both clientJwks and clientJwksUri`, async () => {
    const jwks = { keys: [{ kty: 'RSA', n: 'test-n', e: 'AQAB', kid: 'test-key-1' }] }
    const input = createOidcClientInput({
      clientType: OidcClientType.Confidential,
      tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.PrivateKeyJwt,
      clientJwks: jwks,
      clientJwksUri: 'https://example.com/.well-known/jwks.json',
    })
    const { data, errors } = await executeOperationAsUser({ query: createOidcClientMutation, variables: { input } }, UserRoles.oidcAdmin)
    expect(data?.createOidcClient).toBeUndefined()
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toEqual('clientJwks and clientJwksUri are mutually exclusive')
  })

  it(`can't provide both relyingPartyJwks and relyingPartyJwksUri`, async () => {
    const jarJwks = { keys: [{ kty: 'RSA', n: 'test-n', e: 'AQAB', kid: 'jar-key-1' }] }
    const input = createOidcClientInput({
      authorizationRequestsTypeJarEnabled: true,
      relyingPartyJwks: jarJwks,
      relyingPartyJwksUri: 'https://example.com/.well-known/jwks.json',
    })
    const { data, errors } = await executeOperationAsUser({ query: createOidcClientMutation, variables: { input } }, UserRoles.oidcAdmin)
    expect(data?.createOidcClient).toBeUndefined()
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toEqual('relyingPartyJwks and relyingPartyJwksUri are mutually exclusive')
  })

  it(`can't create a client with invalid JWK structure in clientJwks`, async () => {
    const input = createOidcClientInput({
      clientType: OidcClientType.Confidential,
      tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.PrivateKeyJwt,
      clientJwks: { invalid: 'structure' },
    })
    const { data, errors } = await executeOperationAsUser({ query: createOidcClientMutation, variables: { input } }, UserRoles.oidcAdmin)
    expect(data?.createOidcClient).toBeUndefined()
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toContain('clientJwks must be valid JSON containing a JWK or JWKS object')
  })
})

describe('JAR key configuration', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()
  })

  it('can create a client with JAR enabled and relyingPartyJwksUri', async () => {
    const input = createOidcClientInput({
      authorizationRequestsTypeJarEnabled: true,
      relyingPartyJwksUri: 'https://example.com/.well-known/jwks.json',
    })
    const { data, errors } = await executeOperationAsUser({ query: createOidcClientMutation, variables: { input } }, UserRoles.oidcAdmin)
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.createOidcClient)
    const client = data.createOidcClient
    expect(client.authorizationRequestsTypeJarEnabled).toBe(true)
    expect(client.relyingPartyJwksUri).toEqual('https://example.com/.well-known/jwks.json')
    expect(client.relyingPartyJwks).toBeNull()
  })

  it('can create a client with JAR enabled and inline relyingPartyJwks', async () => {
    const jarJwks = { keys: [{ kty: 'RSA', n: 'test-n', e: 'AQAB', kid: 'jar-key-1', use: 'sig', alg: 'RS256' }] }
    const input = createOidcClientInput({
      authorizationRequestsTypeJarEnabled: true,
      relyingPartyJwks: jarJwks,
    })
    const { data, errors } = await executeOperationAsUser({ query: createOidcClientMutation, variables: { input } }, UserRoles.oidcAdmin)
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.createOidcClient)
    const client = data.createOidcClient
    expect(client.authorizationRequestsTypeJarEnabled).toBe(true)
    expect(client.relyingPartyJwks).toEqual(jarJwks)
    expect(client.relyingPartyJwksUri).toBeNull()
  })

  it('allows JAR without asymmetric keys when using client_secret_post (HS-signed)', async () => {
    const input = createOidcClientInput({
      clientType: OidcClientType.Confidential,
      clientSecret: casual.uuid,
      tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.ClientSecretPost,
      authorizationRequestsTypeJarEnabled: true,
    })
    const { data, errors } = await executeOperationAsUser({ query: createOidcClientMutation, variables: { input } }, UserRoles.oidcAdmin)
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.createOidcClient)
    const client = data.createOidcClient
    expect(client.authorizationRequestsTypeJarEnabled).toBe(true)
    expect(client.relyingPartyJwks).toBeNull()
    expect(client.relyingPartyJwksUri).toBeNull()
  })

  it(`requires JAR keys for private_key_jwt clients with JAR enabled`, async () => {
    const jwks = { keys: [{ kty: 'RSA', n: 'test-n', e: 'AQAB', kid: 'auth-key-1' }] }
    const input = createOidcClientInput({
      clientType: OidcClientType.Confidential,
      tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.PrivateKeyJwt,
      clientJwks: jwks,
      authorizationRequestsTypeJarEnabled: true,
    })
    const { data, errors } = await executeOperationAsUser({ query: createOidcClientMutation, variables: { input } }, UserRoles.oidcAdmin)
    expect(data?.createOidcClient).toBeUndefined()
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toEqual(
      'JAR-enabled clients must have relyingPartyJwks or relyingPartyJwksUri (unless using client_secret_post)',
    )
  })

  it('can create a private_key_jwt client with both auth and JAR keys (duplicated)', async () => {
    const jwks = { keys: [{ kty: 'RSA', n: 'test-n', e: 'AQAB', kid: 'shared-key-1', use: 'sig', alg: 'RS256' }] }
    const input = createOidcClientInput({
      clientType: OidcClientType.Confidential,
      tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.PrivateKeyJwt,
      clientJwks: jwks,
      authorizationRequestsTypeJarEnabled: true,
      relyingPartyJwks: jwks,
    })
    const { data, errors } = await executeOperationAsUser({ query: createOidcClientMutation, variables: { input } }, UserRoles.oidcAdmin)
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.createOidcClient)
    const client = data.createOidcClient
    expect(client.clientJwks).toEqual(jwks)
    expect(client.relyingPartyJwks).toEqual(jwks)
  })

  it('clears JAR keys when JAR is disabled on update', async () => {
    const jarJwks = { keys: [{ kty: 'RSA', n: 'test-n', e: 'AQAB', kid: 'jar-key-1' }] }
    const createInput = createOidcClientInput({
      authorizationRequestsTypeJarEnabled: true,
      relyingPartyJwks: jarJwks,
    })
    const { data: createData } = await executeOperationAsUser(
      { query: createOidcClientMutation, variables: { input: createInput } },
      UserRoles.oidcAdmin,
    )
    expectToBeDefined(createData?.createOidcClient)
    const client = createData.createOidcClient
    expect(client.relyingPartyJwks).toEqual(jarJwks)

    const updateInput = createOidcClientInput({
      authorizationRequestsTypeJarEnabled: false,
    })
    const { data, errors } = await executeOperationAsUser(
      { query: updateOidcClientMutation, variables: { id: client.id, input: updateInput } },
      UserRoles.oidcAdmin,
    )
    expect(errors).toBeUndefined()
    expectToBeDefined(data?.updateOidcClient)
    const updated = data.updateOidcClient
    expect(updated.authorizationRequestsTypeJarEnabled).toBe(false)
    expect(updated.relyingPartyJwks).toBeNull()
    expect(updated.relyingPartyJwksUri).toBeNull()
  })

  it('requires JAR keys for public clients with JAR enabled', async () => {
    const input = createOidcClientInput({
      clientType: OidcClientType.Public,
      authorizationRequestsTypeJarEnabled: true,
    })
    const { data, errors } = await executeOperationAsUser({ query: createOidcClientMutation, variables: { input } }, UserRoles.oidcAdmin)
    expect(data?.createOidcClient).toBeUndefined()
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toEqual(
      'JAR-enabled clients must have relyingPartyJwks or relyingPartyJwksUri (unless using client_secret_post)',
    )
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
    tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.None,
    redirectUris: ['https://example.com/cb'],
    postLogoutUris: ['https://example.com/logout'],
    ...overrides,
  })

  await inTransaction(async (em) => {
    await em.getRepository(OidcClientEntity).save(client)
  }, userId)

  return client
}

async function createPartner(overrides: Partial<PartnerEntity> = {}) {
  let partner: PartnerEntity

  const userId = faker.string.uuid()

  // Ensure a user is associated with the EntityManager for auditing
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

  await inTransaction(async (em) => {
    partner = await em.getRepository(PartnerEntity).save(
      new PartnerEntity({
        name: faker.company.name(),
        did: `did:web:${faker.internet.domainName()}`,
        credentialTypes: [casual.word],
        tenantId: null,
        issuerId: null,
        linkedDomainUrls: null,
        ...overrides,
      }),
    )
  }, userId)

  return partner!
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
