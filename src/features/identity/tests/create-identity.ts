import casual from 'casual'
import { randomUUID } from 'crypto'
import { graphql } from '../../../generated'
import type { IdentityInput } from '../../../generated/graphql'
import { executeOperationAsCredentialAdmin } from '../../../test'
import { invariant } from '../../../util/invariant'

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

export async function deleteIdentities(ids: string[]) {
  const { data } = await executeOperationAsCredentialAdmin({
    query: deleteIdentitiesMutation,
    variables: {
      ids,
    },
  })
  invariant(data, 'data is undefined')
  expect(data.deleteIdentities).toBe(null)
}

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

export const deleteIdentitiesMutation = graphql(`
  mutation DeleteIdentities($ids: [UUID!]!) {
    deleteIdentities(ids: $ids)
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
