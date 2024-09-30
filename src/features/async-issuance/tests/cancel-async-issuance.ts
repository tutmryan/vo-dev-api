import { graphql } from '../../../generated'
import { UserRoles } from '../../../roles'
import { executeOperationAsUser } from '../../../test'

export const cancelAsyncIssuanceRequestMutation = graphql(`
  mutation CancelAsyncIssuanceRequest($asyncIssuanceRequestId: UUID!) {
    cancelAsyncIssuanceRequest(asyncIssuanceRequestId: $asyncIssuanceRequestId) {
      ...AsyncIssuanceRequestFragment
    }
  }
`)

export async function cancelAsyncIssuanceRequest(asyncIssuanceRequestId: string) {
  const { data, errors } = await executeOperationAsUser(
    {
      query: cancelAsyncIssuanceRequestMutation,
      variables: { asyncIssuanceRequestId },
    },
    UserRoles.issuer,
  )

  if (errors) throw new Error(`Error while cancelling the async issuance: ${JSON.stringify(errors)}`)
  if (!data) throw new Error('No data returned')

  return data.cancelAsyncIssuanceRequest
}
