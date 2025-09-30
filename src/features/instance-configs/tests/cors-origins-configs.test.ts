import { faker } from '@faker-js/faker'
import { graphql } from '../../../generated'
import { CorsOriginConfigInput } from '../../../generated/graphql'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsInstanceAdmin, expectUnauthorizedError } from '../../../test'

faker.seed(Date.now())

function getRandomInput(): CorsOriginConfigInput {
  return {
    origin: faker.internet.url(),
  }
}

const findQuery = graphql(`
  query GetCorsOriginConfigs {
    corsOriginConfigs {
      id
      origin
    }
  }
`)

const setMutation = graphql(`
  mutation SetCorsOriginConfigs($input: [CorsOriginConfigInput!]!) {
    setCorsOriginConfigs(input: $input) {
      id
      origin
    }
  }
`)

describe('CorsOriginConfig', () => {
  beforeAfterAll()

  describe('setCorsOriginConfigs', () => {
    it('allows instance admins to set config list', async () => {
      const input = [getRandomInput(), getRandomInput()]
      const { data, errors } = await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { input },
      })

      expect(errors).toBeUndefined()
      expect(data?.setCorsOriginConfigs).toEqual(expect.arrayContaining(input.map((entry) => expect.objectContaining(entry))))
    })

    it('overwrites previous configs when setting a new list', async () => {
      const initial = [getRandomInput(), getRandomInput()]
      const updated = [getRandomInput()] // fewer, different entries

      await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { input: initial },
      })

      await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { input: updated },
      })

      const res = await executeOperationAsInstanceAdmin({ query: findQuery })
      expect(res.errors).toBeUndefined()
      expect(res.data?.corsOriginConfigs).toEqual(expect.arrayContaining(updated.map((entry) => expect.objectContaining(entry))))
    })

    it('returns unauthorized for anonymous users', async () => {
      const input = [getRandomInput()]
      const { data, errors } = await executeOperationAnonymous({
        query: setMutation,
        variables: { input },
      })

      expect(data).toBeNull()
      expectUnauthorizedError(errors)
    })
  })

  describe('corsOriginConfigs query', () => {
    it('returns a list after setting configs', async () => {
      const input = [getRandomInput()]
      await executeOperationAsInstanceAdmin({
        query: setMutation,
        variables: { input },
      })

      const res = await executeOperationAsInstanceAdmin({ query: findQuery })

      expect(res.errors).toBeUndefined()
      expect(res.data?.corsOriginConfigs).toEqual(expect.arrayContaining(input.map((entry) => expect.objectContaining(entry))))
    })

    it('returns unauthorized for anonymous users', async () => {
      const { data, errors } = await executeOperationAnonymous({ query: findQuery })
      expect(data).toBeNull()
      expectUnauthorizedError(errors)
    })
  })
})
