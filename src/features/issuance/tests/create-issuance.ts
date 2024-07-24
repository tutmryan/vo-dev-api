import { graphql } from '../../../generated'
import type { IssuanceRequestInput } from '../../../generated/graphql'
import { executeOperationAsCredentialAdmin } from '../../../test'

export const createIssuanceRequestMutation = graphql(`
  mutation CreateIssuanceRequestT($request: IssuanceRequestInput!) {
    createIssuanceRequest(request: $request) {
      ... on IssuanceResponse {
        requestId
        url
        qrCode
      }
      ... on RequestErrorResponse {
        error {
          code
          message
        }
      }
    }
  }
`)

export async function createIssuanceRequest(request: IssuanceRequestInput) {
  const { data, errors } = await executeOperationAsCredentialAdmin({
    query: createIssuanceRequestMutation,
    variables: {
      request,
    },
  })

  if (errors) {
    throw new Error(`Error while creating a contract: ${JSON.stringify(errors)}`)
  }

  return data!.createIssuanceRequest
}
