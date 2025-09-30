import { faker } from '@faker-js/faker/locale/en'
import { graphql } from '../../../generated'
import { ApplicationLabelConfigInput, IdentityStoreType } from '../../../generated/graphql'
import {
  beforeAfterAll,
  executeOperationAnonymous,
  executeOperationAsInstanceAdmin,
  expectUnauthorizedError,
  inTransaction,
} from '../../../test'
import { IdentityStoreEntity } from '../../identity-store/entities/identity-store-entity'
import { UserEntity } from '../../users/entities/user-entity'

faker.seed(Date.now())

function getRandomInput(): ApplicationLabelConfigInput {
  return {
    identifier: faker.string.uuid(),
    name: faker.company.name(),
  }
}

const findQuery = graphql(`
  query GetApplicationLabelConfigs($identityStoreId: ID!) {
    applicationLabelConfigs(identityStoreId: $identityStoreId) {
      id
      identifier
      name
    }
  }
`)

const setMutation = graphql(`
  mutation SetApplicationLabelConfigs($identityStoreId: ID!, $input: [ApplicationLabelConfigInput!]!) {
    setApplicationLabelConfigs(identityStoreId: $identityStoreId, input: $input) {
      id
      identifier
      name
    }
  }
`)

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

describe('ApplicationLabelConfig', () => {
  beforeAfterAll()

  let identityStoreId: string
  beforeAll(async () => {
    const store = await insertMockIdentityStore()
    identityStoreId = store.id
  })

  describe('setApplicationLabelConfigs', () => {
    it('allows instance admins to set config list', async () => {
      const input = [getRandomInput(), getRandomInput()]
      const { data, errors } = await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { identityStoreId, input },
      })

      expect(errors).toBeUndefined()
      expect(data?.setApplicationLabelConfigs).toEqual(expect.arrayContaining(input.map((entry) => expect.objectContaining(entry))))
    })

    it('overwrites previous configs when setting a new list', async () => {
      const initial = [getRandomInput(), getRandomInput()]
      const updated = [getRandomInput()]

      await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { identityStoreId, input: initial },
      })

      await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { identityStoreId, input: updated },
      })

      const res = await executeOperationAsInstanceAdmin({
        query: findQuery,
        variables: { identityStoreId },
      })
      expect(res.errors).toBeUndefined()
      expect(res.data?.applicationLabelConfigs).toEqual(expect.arrayContaining(updated.map((entry) => expect.objectContaining(entry))))
    })

    it('returns unauthorized for anonymous users', async () => {
      const input = [getRandomInput()]
      const { data, errors } = await executeOperationAnonymous({
        query: setMutation,
        variables: { identityStoreId, input },
      })
      expect(data).toBeNull()
      expectUnauthorizedError(errors)
    })
  })

  describe('applicationLabelConfigs query', () => {
    it('returns a list after setting configs', async () => {
      const input = [getRandomInput()]
      await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { identityStoreId, input },
      })

      const res = await executeOperationAsInstanceAdmin({
        query: findQuery,
        variables: { identityStoreId },
      })
      expect(res.errors).toBeUndefined()
      expect(res.data?.applicationLabelConfigs).toEqual(expect.arrayContaining(input.map((entry) => expect.objectContaining(entry))))
    })

    it('returns unauthorized for anonymous users', async () => {
      const { data, errors } = await executeOperationAnonymous({
        query: findQuery,
        variables: { identityStoreId },
      })
      expect(data).toBeNull()
      expectUnauthorizedError(errors)
    })
  })
})
