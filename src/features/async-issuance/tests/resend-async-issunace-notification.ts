import { graphql } from '../../../generated'
import { UserRoles } from '../../../roles'
import { executeOperationAsUser } from '../../../test'

export const resendAsyncIssuanceNotificationMutation = graphql(`
  mutation ResendAsyncIssuanceNotification($asyncIssuanceRequestId: UUID!) {
    resendAsyncIssuanceNotification(asyncIssuanceRequestId: $asyncIssuanceRequestId) {
      ...AsyncIssuanceRequestFragment
    }
  }
`)

export async function resendAsyncIssuanceNotification(asyncIssuanceRequestId: string) {
  const { data, errors } = await executeOperationAsUser(
    {
      query: resendAsyncIssuanceNotificationMutation,
      variables: { asyncIssuanceRequestId },
    },
    UserRoles.issuer,
  )

  if (errors) throw new Error(`Error while resending the async issuance: ${JSON.stringify(errors)}`)
  if (!data) throw new Error('No data returned')

  return data.resendAsyncIssuanceNotification
}
