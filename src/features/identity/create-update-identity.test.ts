import casual from 'casual'
import { randomUUID } from 'crypto'
import { graphql } from '../../generated'
import type { IdentityInput } from '../../generated/graphql'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsCredentialAdmin, expectUnauthorizedError } from '../../test'
import { invariant } from '../../util/invariant'

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

export const saveIdentityMutation = graphql(`
  mutation SaveIdentity($input: IdentityInput!) {
    saveIdentity(input: $input) {
      id
      issuer
      identifier
      name
    }
  }
`)

export function createIdentityInput(input?: Partial<IdentityInput>): IdentityInput {
  return {
    issuer: 'issuer',
    identifier: randomUUID(),
    name: casual.name,
    ...input,
  }
}

export async function createIdentity(input: IdentityInput = createIdentityInput()) {
  const { data } = await executeOperationAsCredentialAdmin({
    query: saveIdentityMutation,
    variables: {
      input,
    },
  })
  invariant(data?.saveIdentity, 'data?.saveIdentity is undefined')
  return data.saveIdentity
}

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

    expect(updateResponse.data?.saveIdentity.id).toEqual(firstResponse.data?.saveIdentity.id.toUpperCase())
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

    expect(data?.identity).toMatchObject({ ...input, id: saveResponse.data?.saveIdentity.id.toUpperCase() })
  })

  it('returns an errors when in an anonymous context', async () => {
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
