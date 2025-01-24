import casual from 'casual'
import { graphql } from '../../generated'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsCredentialAdmin, expectUnauthorizedError } from '../../test'
import { invariant } from '../../util/invariant'
import { createIdentityInput, saveIdentityMutation } from './tests/create-identity'

export const identityQuery = graphql(`
  query Identity($id: ID!) {
    identity(id: $id) {
      id
      issuer
      identifier
      name
    }
  }
`)

describe('create-update-identity', () => {
  beforeAfterAll()

  it('should save an identity', async () => {
    // Arrange
    const input = createIdentityInput()

    // Act
    const { data, errors } = await executeOperationAsCredentialAdmin({
      query: saveIdentityMutation,
      variables: {
        input,
      },
    })

    // Assert
    expect(errors).toBeUndefined()
    expect(data).toBeDefined()

    const identity = data!.saveIdentity

    expect(identity.id).toBeDefined()
    expect(identity).toMatchObject(input)
  })

  it('should save and update an identity', async () => {
    const input = createIdentityInput()

    // first save
    const firstResponse = await executeOperationAsCredentialAdmin({
      query: saveIdentityMutation,
      variables: {
        input,
      },
    })
    expect(firstResponse.errors).toBeUndefined()
    expect(firstResponse.data).toBeDefined()

    // update the identity to have a different name
    const updatedInput = { ...input, name: casual.name }
    const updateResponse = await executeOperationAsCredentialAdmin({
      query: saveIdentityMutation,
      variables: {
        input: updatedInput,
      },
    })

    expect(updateResponse.errors).toBeUndefined()
    expect(updateResponse.data).toBeDefined()

    expect(updateResponse.data?.saveIdentity.id).toEqual(firstResponse.data?.saveIdentity.id)
    expect(updateResponse.data?.saveIdentity).toMatchObject(updatedInput)
  })

  it('should return an identity by ID', async () => {
    const input = createIdentityInput()

    const saveResponse = await executeOperationAsCredentialAdmin({
      query: saveIdentityMutation,
      variables: {
        input,
      },
    })

    invariant(saveResponse.data?.saveIdentity.id, 'saveResponse.data?.saveIdentity.id is undefined')

    const { data, errors } = await executeOperationAsCredentialAdmin({
      query: identityQuery,
      variables: {
        id: saveResponse.data?.saveIdentity.id,
      },
    })

    expect(errors).toBeUndefined()
    expect(data).toBeDefined()

    expect(data?.identity).toMatchObject({ ...input, id: saveResponse.data?.saveIdentity.id })
  })

  it('returns an unauthorized error when accessed anonymously', async () => {
    // Arrange
    const input = createIdentityInput()

    // Act
    const { errors } = await executeOperationAnonymous({
      query: saveIdentityMutation,
      variables: {
        input,
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })
})
