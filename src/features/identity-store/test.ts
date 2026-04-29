import { faker } from '@faker-js/faker/locale/en'
import { graphql } from '../../generated'
import {
  CreateIdentityStoreMutation,
  IdentityStoreInput,
  IdentityStoreType,
  ResumeIdentityStoreMutation,
  SuspendIdentityStoreMutation,
  UpdateIdentityStoreInput,
  UpdateIdentityStoreMutation,
} from '../../generated/graphql'
import {
  beforeAfterAll,
  executeOperationAnonymous,
  executeOperationAsCredentialAdmin,
  executeOperationAsInstanceAdmin,
  expectUnauthorizedError,
} from '../../test'
import { mockedServices } from '../../test/mocks'

faker.seed(Date.now())

function getRequiredRandomInput(): IdentityStoreInput {
  return {
    identifier: faker.string.uuid(),
    name: 'someName',
    type: IdentityStoreType.Entra,
    isAuthenticationEnabled: true,
    accessPackagesEnabled: false,
  }
}

function getRequiredUpdateRandomInput(): UpdateIdentityStoreInput {
  return {
    name: 'someUpdatedName',
    type: IdentityStoreType.Entra,
    isAuthenticationEnabled: true,
    accessPackagesEnabled: false,
  }
}

export const identityStoreFragment = graphql(`
  fragment IdentityStoreFields on IdentityStore {
    id
    identifier
    name
    type
    isAuthenticationEnabled
    clientId
    suspendedAt
  }
`)

const createMutation = graphql(`
  mutation CreateIdentityStore($input: IdentityStoreInput!) {
    createIdentityStore(input: $input) {
      ...IdentityStoreFields
    }
  }
`)

const updateMutation = graphql(`
  mutation UpdateIdentityStore($id: ID!, $input: UpdateIdentityStoreInput!) {
    updateIdentityStore(id: $id, input: $input) {
      ...IdentityStoreFields
    }
  }
`)

const suspendMutation = graphql(`
  mutation SuspendIdentityStore($id: ID!) {
    suspendIdentityStore(id: $id) {
      ...IdentityStoreFields
    }
  }
`)

const resumeMutation = graphql(`
  mutation ResumeIdentityStore($id: ID!) {
    resumeIdentityStore(id: $id) {
      ...IdentityStoreFields
    }
  }
`)

const findQuery = graphql(`
  query FindIdentityStores {
    findIdentityStores {
      ...IdentityStoreFields
    }
  }
`)

export const findQueryWithWhere = graphql(`
  query FindIdentityStoresWithWhere($where: IdentityStoreWhere) {
    findIdentityStores(where: $where) {
      ...IdentityStoreFields
    }
  }
`)
const byIdQuery = graphql(`
  query IdentityStoreById($id: ID!) {
    identityStore(id: $id) {
      ...IdentityStoreFields
    }
  }
`)

describe('IdentityStore', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()
  })

  describe('createIdentityStore', () => {
    it('allows instance admins to create', async () => {
      const input = getRequiredRandomInput()
      const { data, errors } = await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input } })
      expect(errors).toBeUndefined()
      expect(data?.createIdentityStore).toMatchObject({
        id: expect.any(String),
        ...input,
      } satisfies Omit<CreateIdentityStoreMutation['createIdentityStore'], '__typename'>)
      expect(mockedServices.identityStoreSecretService.set.mock()).not.toHaveBeenCalled()
    })

    it('returns unauthorized when called with unauthorized role', async () => {
      const input = getRequiredRandomInput()
      const { data, errors } = await executeOperationAnonymous({ query: createMutation, variables: { input } })
      expect(data).toBeNull()
      expectUnauthorizedError(errors)
    })

    it('returns BAD_USER_INPUT when only clientId is provided', async () => {
      const input: IdentityStoreInput = { ...getRequiredRandomInput(), clientId: 'id-only' }
      const { errors } = await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input } })
      expect(errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT')
    })

    it('returns BAD_USER_INPUT when only clientSecret is provided', async () => {
      const input: IdentityStoreInput = { ...getRequiredRandomInput(), clientId: undefined, clientSecret: 'sec' }
      const { errors } = await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input } })
      expect(errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT')
    })

    it('stores secret via service when both clientId and clientSecret provided', async () => {
      const input: IdentityStoreInput = { ...getRequiredRandomInput(), clientId: 'abc', clientSecret: 'shh' }
      const { data, errors } = await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input } })
      expect(errors).toBeUndefined()
      expect(mockedServices.identityStoreSecretService.set.lastCallArgs()).toEqual(['abc', 'shh'])
      expect(data?.createIdentityStore.clientId).toBe('abc')
    })

    it('does not store secret when the entity save fails due to duplicate identifier', async () => {
      const identifier = faker.string.uuid()
      // Create first time to occupy the identifier
      const existingInput: IdentityStoreInput = { ...getRequiredRandomInput(), identifier }
      await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input: existingInput } })
      mockedServices.identityStoreSecretService.set.mock().mockClear()

      // Attempt to create again with same identifier + credentials — entity save will fail
      const duplicateInput: IdentityStoreInput = { ...getRequiredRandomInput(), identifier, clientId: 'cid2', clientSecret: 'sec2' }
      const res = await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input: duplicateInput } })
      expect(res.errors).toBeDefined()
      // Secret must NOT have been stored because the entity save failed first
      expect(mockedServices.identityStoreSecretService.set.mock()).not.toHaveBeenCalled()
    })

    it('fails the mutation if secret service set fails', async () => {
      const identifier = faker.string.uuid()
      mockedServices.identityStoreSecretService.set.mock().mockRejectedValueOnce(new Error('kv failed'))
      const input: IdentityStoreInput = {
        ...getRequiredRandomInput(),
        identifier,
        clientId: 'cid',
        clientSecret: 'sec',
      }
      const res = await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input } })
      expect(res.errors).toBeDefined()
    })
  })

  describe('updateIdentityStore', () => {
    it('allows instance admins to update', async () => {
      const createInput = getRequiredRandomInput()
      const createRes = await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input: createInput } })
      const id = createRes.data!.createIdentityStore.id
      const updateInput = getRequiredUpdateRandomInput()
      const { data, errors } = await executeOperationAsInstanceAdmin({ query: updateMutation, variables: { id, input: updateInput } })
      expect(errors).toBeUndefined()
      expect(data?.updateIdentityStore).toMatchObject({
        id,
        identifier: createInput.identifier,
        ...updateInput,
      } satisfies Omit<UpdateIdentityStoreMutation['updateIdentityStore'], '__typename'>)
      expect(mockedServices.identityStoreSecretService.set.mock()).not.toHaveBeenCalled()
    })

    it('returns unauthorized when called with unauthorized role', async () => {
      const fakeId = faker.string.uuid()
      const updateInput = getRequiredUpdateRandomInput()
      const { data, errors } = await executeOperationAnonymous({ query: updateMutation, variables: { id: fakeId, input: updateInput } })
      expect(data).toBeNull()
      expectUnauthorizedError(errors)
    })

    it('returns BAD_USER_INPUT when only clientId is provided', async () => {
      const createRes = await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input: getRequiredRandomInput() } })
      const id = createRes.data!.createIdentityStore.id
      const updateInput: IdentityStoreInput = { ...getRequiredRandomInput(), clientId: 'id-only' }
      const { errors } = await executeOperationAsInstanceAdmin({ query: updateMutation, variables: { id, input: updateInput } })
      expect(errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT')
    })

    it('returns BAD_USER_INPUT when only clientSecret is provided', async () => {
      const createRes = await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input: getRequiredRandomInput() } })
      const id = createRes.data!.createIdentityStore.id
      const updateInput: UpdateIdentityStoreInput = { ...getRequiredUpdateRandomInput(), clientId: undefined, clientSecret: 'sec' }
      const { errors } = await executeOperationAsInstanceAdmin({ query: updateMutation, variables: { id, input: updateInput } })
      expect(errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT')
    })

    it('stores secret via service when both provided on update', async () => {
      const createRes = await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input: getRequiredRandomInput() } })
      const id = createRes.data!.createIdentityStore.id
      const updateInput: UpdateIdentityStoreInput = { ...getRequiredUpdateRandomInput(), clientId: 'xyz', clientSecret: 'top' }
      const { errors } = await executeOperationAsInstanceAdmin({ query: updateMutation, variables: { id, input: updateInput } })
      expect(errors).toBeUndefined()
      expect(mockedServices.identityStoreSecretService.set.lastCallArgs()).toEqual(['xyz', 'top'])
    })

    it('fails the update if secret service set fails', async () => {
      const createRes = await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input: getRequiredRandomInput() } })
      const id = createRes.data!.createIdentityStore.id
      mockedServices.identityStoreSecretService.set.mock().mockRejectedValueOnce(new Error('kv failed'))
      const updateInput: UpdateIdentityStoreInput = { ...getRequiredUpdateRandomInput(), clientId: 'xyz', clientSecret: 'top' }
      const res = await executeOperationAsInstanceAdmin({ query: updateMutation, variables: { id, input: updateInput } })
      expect(res.errors).toBeDefined()
    })

    it('clears clientId when explicitly set to null and deletes the old secret', async () => {
      const clientId = '11111111-1111-1111-1111-111111111111'
      const createInput = { ...getRequiredRandomInput(), clientId, clientSecret: 'someSecret' }
      const createRes = await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input: createInput } })
      expect(createRes.data!.createIdentityStore.clientId).toBe(clientId)

      const updateInput: UpdateIdentityStoreInput = { ...getRequiredUpdateRandomInput(), clientId: null }
      const { data, errors } = await executeOperationAsInstanceAdmin({
        query: updateMutation,
        variables: { id: createRes.data!.createIdentityStore.id, input: updateInput },
      })
      expect(errors).toBeUndefined()
      expect(data?.updateIdentityStore.clientId).toBeNull()
      // Old secret must be removed from the KV store
      expect(mockedServices.identityStoreSecretService.delete.lastCallArgs()).toEqual([clientId])
    })

    it('deletes the old secret when clientId is rotated to a new value', async () => {
      const oldClientId = '22222222-2222-2222-2222-222222222222'
      const newClientId = '33333333-3333-3333-3333-333333333333'
      const createInput = { ...getRequiredRandomInput(), clientId: oldClientId, clientSecret: 'secret1' }
      const createRes = await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input: createInput } })
      const id = createRes.data!.createIdentityStore.id

      const updateInput: UpdateIdentityStoreInput = { ...getRequiredUpdateRandomInput(), clientId: newClientId, clientSecret: 'secret2' }
      const { errors } = await executeOperationAsInstanceAdmin({ query: updateMutation, variables: { id, input: updateInput } })
      expect(errors).toBeUndefined()
      // Old secret keyed to oldClientId should have been removed
      expect(mockedServices.identityStoreSecretService.delete.lastCallArgs()).toEqual([oldClientId])
    })

    it('does not delete the secret when only non-credential fields are updated', async () => {
      const clientId = '44444444-4444-4444-4444-444444444444'
      const createInput = { ...getRequiredRandomInput(), clientId, clientSecret: 'secret' }
      const createRes = await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input: createInput } })
      const id = createRes.data!.createIdentityStore.id

      // Update only the name — no clientId or clientSecret change
      const updateInput: UpdateIdentityStoreInput = { ...getRequiredUpdateRandomInput() }
      const { errors } = await executeOperationAsInstanceAdmin({ query: updateMutation, variables: { id, input: updateInput } })
      expect(errors).toBeUndefined()
      expect(mockedServices.identityStoreSecretService.delete.mock()).not.toHaveBeenCalled()
    })
  })

  describe('suspend/resume', () => {
    it('excludes suspended stores by default', async () => {
      const input = getRequiredRandomInput()

      const { data: createData } = await executeOperationAsInstanceAdmin({
        query: createMutation,
        variables: { input },
      })

      const id = createData!.createIdentityStore.id

      await executeOperationAsInstanceAdmin({
        query: suspendMutation,
        variables: { id },
      })

      const res = await executeOperationAsInstanceAdmin({
        query: findQuery,
      })

      const ids = res.data?.findIdentityStores.map((s) => s.id)
      expect(ids).not.toContain(id)
    })

    it('includes suspended stores when includeDeleted is true', async () => {
      const input = getRequiredRandomInput()

      const { data: createData } = await executeOperationAsInstanceAdmin({
        query: createMutation,
        variables: { input },
      })

      const id = createData!.createIdentityStore.id

      await executeOperationAsInstanceAdmin({
        query: suspendMutation,
        variables: { id },
      })

      const res = await executeOperationAsInstanceAdmin({
        query: findQueryWithWhere,
        variables: { where: { includeDeleted: true } },
      })

      const ids = res.data?.findIdentityStores.map((s) => s.id)
      expect(ids).toContain(id)
    })

    it('only returns suspended stores when isDeleted is true', async () => {
      const input = getRequiredRandomInput()

      const { data: createData } = await executeOperationAsInstanceAdmin({
        query: createMutation,
        variables: { input },
      })

      const id = createData!.createIdentityStore.id

      await executeOperationAsInstanceAdmin({
        query: suspendMutation,
        variables: { id },
      })

      const res = await executeOperationAsInstanceAdmin({
        query: findQueryWithWhere,
        variables: { where: { isDeleted: true } },
      })

      expect(res.errors).toBeUndefined()
      const resultIds = res.data?.findIdentityStores.map((s) => s.id)
      expect(resultIds).toContain(id)
    })

    it('excludes suspended stores when isDeleted is false', async () => {
      const input = getRequiredRandomInput()

      const { data: createData } = await executeOperationAsInstanceAdmin({
        query: createMutation,
        variables: { input },
      })

      const id = createData!.createIdentityStore.id

      await executeOperationAsInstanceAdmin({
        query: suspendMutation,
        variables: { id },
      })

      const res = await executeOperationAsInstanceAdmin({
        query: findQueryWithWhere,
        variables: { where: { isDeleted: false } },
      })

      const resultIds = res.data?.findIdentityStores.map((s) => s.id)
      expect(resultIds).not.toContain(id)
    })

    it('allows instance admins to suspend', async () => {
      const createInput = getRequiredRandomInput()
      const createRes = await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input: createInput } })

      const id = createRes.data!.createIdentityStore.id
      const response = await executeOperationAsInstanceAdmin({ query: suspendMutation, variables: { id } })

      expect(response.errors).toBeUndefined()
      expect(response.data?.suspendIdentityStore).toMatchObject({
        id,
        suspendedAt: expect.any(Date),
        ...createInput,
      } satisfies Omit<SuspendIdentityStoreMutation['suspendIdentityStore'], '__typename'>)
    })

    it('allows instance admins to resume', async () => {
      const createInput = getRequiredRandomInput()
      const createRes = await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input: createInput } })
      const id = createRes.data!.createIdentityStore.id

      await executeOperationAsInstanceAdmin({ query: suspendMutation, variables: { id } })
      const resumeRes = await executeOperationAsInstanceAdmin({ query: resumeMutation, variables: { id } })

      expect(resumeRes.errors).toBeUndefined()
      expect(resumeRes.data?.resumeIdentityStore).toMatchObject({
        id,
        ...createInput,
      } satisfies Omit<ResumeIdentityStoreMutation['resumeIdentityStore'], '__typename'>)
    })

    it('returns unauthorized when called with unauthorized role', async () => {
      const fakeId = faker.string.uuid()
      const { errors: suspendErrors } = await executeOperationAnonymous({ query: suspendMutation, variables: { id: fakeId } })
      expectUnauthorizedError(suspendErrors)
      const { errors: resumeErrors } = await executeOperationAnonymous({ query: resumeMutation, variables: { id: fakeId } })
      expectUnauthorizedError(resumeErrors)
    })
  })

  describe('queries', () => {
    it('findIdentityStores returns a list', async () => {
      await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input: getRequiredRandomInput() } })
      const res = await executeOperationAsInstanceAdmin({ query: findQuery })
      expect(res.errors).toBeUndefined()
      expect(Array.isArray(res.data?.findIdentityStores)).toBe(true)
    })

    it('identityStore by id returns matching identity store', async () => {
      const createRes = await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input: getRequiredRandomInput() } })
      const id = createRes.data!.createIdentityStore.id
      const res = await executeOperationAsInstanceAdmin({ query: byIdQuery, variables: { id } })
      expect(res.errors).toBeUndefined()
      expect(res.data?.identityStore).toMatchObject({ id, identifier: expect.any(String) })
    })

    it('returns unauthorized when called with unauthorized role', async () => {
      const { data, errors } = await executeOperationAnonymous({ query: findQuery })
      expect(data).toBeNull()
      expectUnauthorizedError(errors)
    })

    it('allows credential admin to find identity stores', async () => {
      const { data, errors } = await executeOperationAsCredentialAdmin({ query: findQuery })
      expect(errors).toBeUndefined()
      expect(data?.findIdentityStores).toBeInstanceOf(Array)
    })

    it('allows credential admin to find a single identity store by id', async () => {
      const createRes = await executeOperationAsInstanceAdmin({ query: createMutation, variables: { input: getRequiredRandomInput() } })
      const id = createRes.data!.createIdentityStore.id

      const { data, errors } = await executeOperationAsCredentialAdmin({ query: byIdQuery, variables: { id } })
      expect(errors).toBeUndefined()
      expect(data?.identityStore).toMatchObject({ id })
    })
  })
})
