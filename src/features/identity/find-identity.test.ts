import { randomUUID } from 'crypto'
import { graphql } from '../../generated'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsCredentialAdmin, expectUnauthorizedError } from '../../test'
import { createIdentityInput, saveIdentityMutation } from './create-update-identity.test'

export const findIdentitiesQuery = graphql(`
  query FindIdentities($where: IdentityWhere, $limit: PositiveInt, $offset: PositiveInt) {
    findIdentities(where: $where, limit: $limit, offset: $offset) {
      id
      issuer
      identifier
      name
    }
  }
`)

describe('find-identity', () => {
  beforeAfterAll()

  it('should find an identity by partial name', async () => {
    // Arrange
    const input = createIdentityInput({ name: randomUUID() })

    await executeOperationAsCredentialAdmin({
      query: saveIdentityMutation,
      variables: {
        input,
      },
    })

    // Act
    const { data } = await executeOperationAsCredentialAdmin({
      query: findIdentitiesQuery,
      variables: {
        where: {
          name: input.name.slice(-10),
        },
      },
    })

    // Assert
    expect(data?.findIdentities[0]?.name).toEqual(input.name)
  })

  it('returns an errors when in an anonymous context', async () => {
    // Act
    const { errors } = await executeOperationAnonymous({
      query: findIdentitiesQuery,
      variables: {
        where: {
          name: 'test',
        },
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })
})
