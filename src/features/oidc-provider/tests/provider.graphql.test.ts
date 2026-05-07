import { createOidcClient, createOidcClientInput, oidcClientQuery, updateOidcClientMutation } from '.'
import { OidcClientType } from '../../../generated/graphql'
import { UserRoles } from '../../../roles'
import { beforeAfterAll, executeOperationAsUser, expectToBeDefined } from '../../../test'
import { mockedServices } from '../../../test/mocks'

const JWKS_URI = 'https://rp.example.com/jwks'

describe('OIDC client request objects and JAR configuration', () => {
  beforeAfterAll()

  beforeEach(() => {
    mockedServices.clearAllMocks()
  })

  it('creates a client with JAR disabled and no relying party JWKS URI by default', async () => {
    const { data, errors } = await createOidcClient()

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.createOidcClient)
    const client = data!.createOidcClient

    expect(client.authorizationRequestsTypeJarEnabled).toBe(false)
    expect(client.relyingPartyJwksUri).toBeNull()
  })

  it('creates a client with JAR enabled and relying party JWKS URI set', async () => {
    const { data, errors } = await createOidcClient({
      clientType: OidcClientType.Public,
      authorizationRequestsTypeJarEnabled: true,
      relyingPartyJwksUri: JWKS_URI,
    })

    expect(errors).toBeUndefined()
    expectToBeDefined(data?.createOidcClient)
    const client = data!.createOidcClient

    expect(client.authorizationRequestsTypeJarEnabled).toBe(true)
    expect(client.relyingPartyJwksUri).toBe(JWKS_URI)
  })

  it('fails to enable JAR without a relying party JWKS URI on update', async () => {
    const { data: createData } = await createOidcClient({ clientType: OidcClientType.Public })
    expectToBeDefined(createData?.createOidcClient)
    const client = createData!.createOidcClient

    const updateInput = createOidcClientInput({
      clientType: client.clientType,
      authorizationRequestsTypeJarEnabled: true,
      relyingPartyJwksUri: undefined,
    })

    const { data, errors } = await executeOperationAsUser(
      { query: updateOidcClientMutation, variables: { id: client.id, input: updateInput } },
      UserRoles.oidcAdmin,
    )

    expect(data?.updateOidcClient).toBeUndefined()
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toEqual(
      'JAR-enabled clients must have relyingPartyJwks or relyingPartyJwksUri (unless using client_secret_post)',
    )
  })

  it('can disable JAR and clear relying party JWKS URI on update', async () => {
    const { data: createData, errors: createErrors } = await createOidcClient({
      clientType: OidcClientType.Public,
      authorizationRequestsTypeJarEnabled: true,
      relyingPartyJwksUri: JWKS_URI,
    })

    expect(createErrors).toBeUndefined()
    expectToBeDefined(createData?.createOidcClient)
    const client = createData!.createOidcClient

    const updateInput = createOidcClientInput({
      clientType: client.clientType,
      authorizationRequestsTypeJarEnabled: false,
      relyingPartyJwksUri: null,
    })

    const { data: updateData, errors: updateErrors } = await executeOperationAsUser(
      { query: updateOidcClientMutation, variables: { id: client.id, input: updateInput } },
      UserRoles.oidcAdmin,
    )

    expect(updateErrors).toBeUndefined()
    expectToBeDefined(updateData?.updateOidcClient)
    const updated = updateData!.updateOidcClient

    expect(updated.authorizationRequestsTypeJarEnabled).toBe(false)
    expect(updated.relyingPartyJwksUri).toBeNull()

    const { data: queryData, errors: queryErrors } = await executeOperationAsUser(
      { query: oidcClientQuery, variables: { id: client.id } },
      UserRoles.oidcAdmin,
    )

    expect(queryErrors).toBeUndefined()
    expectToBeDefined(queryData?.oidcClient)
    const queried = queryData!.oidcClient

    expect(queried.authorizationRequestsTypeJarEnabled).toBe(false)
    expect(queried.relyingPartyJwksUri).toBeNull()
  })
})
