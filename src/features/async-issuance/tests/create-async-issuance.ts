import { graphql } from '../../../generated'
import type { AsyncIssuanceRequestInput } from '../../../generated/graphql'
import { UserRoles } from '../../../roles'
import { executeOperationAsUser } from '../../../test'
import type { NonEmptyArray } from '../../../util/type-helpers'

export const createAsyncIssuanceRequestMutation = graphql(`
  mutation CreateAsyncIssuanceRequest($request: [AsyncIssuanceRequestInput!]!) {
    createAsyncIssuanceRequest(request: $request) {
      ... on AsyncIssuanceResponse {
        __typename
        asyncIssuanceRequestIds
      }
      ... on AsyncIssuanceErrorResponse {
        __typename
        errors
      }
    }
  }
`)

export async function createAsyncIssuanceRequest(request: NonEmptyArray<AsyncIssuanceRequestInput>) {
  const { data, errors } = await executeOperationAsUser(
    {
      query: createAsyncIssuanceRequestMutation,
      variables: {
        request,
      },
    },
    UserRoles.issuer,
  )

  if (errors) throw new Error(`Error while creating a async issuance request: ${JSON.stringify(errors)}`)
  if (!data) throw new Error('No data returned')

  return data!.createAsyncIssuanceRequest
}
