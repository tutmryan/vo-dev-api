import { graphql } from '../../../generated'
import type { AcquireLimitedAccessTokenInput, IssuanceRequestInput } from '../../../generated/graphql'
import { executeOperationAsLimitedAccessClient } from '../../../test'

export const createIssuanceRequestMutation = graphql(`
  mutation CreateIssuanceRequest($request: IssuanceRequestInput!) {
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
    throw new Error(`Error while creating a issuance request: ${JSON.stringify(errors)}`)
  }

  return data!.createIssuanceRequest
}
