import { graphql } from '../../../generated'
import type { AcquireLimitedAccessTokenInput, IssuanceRequestInput } from '../../../generated/graphql'
import { executeOperationAsLimitedAccessClient } from '../../../test'

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

export async function createIssuanceRequest(request: IssuanceRequestInput, limitedAccessData: AcquireLimitedAccessTokenInput) {
  const { data, errors } = await executeOperationAsLimitedAccessClient(
    {
      query: createIssuanceRequestMutation,
      variables: {
        request,
      },
    },
    limitedAccessData,
  )

  if (errors) {
    throw new Error(`Error while creating a contract: ${JSON.stringify(errors)}`)
  }

  return data!.createIssuanceRequest
}
