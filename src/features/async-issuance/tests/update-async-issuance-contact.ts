import { graphql } from '../../../generated'
import type { AsyncIssuanceContactInput } from '../../../generated/graphql'
import { UserRoles } from '../../../roles'
import { executeOperationAsUser } from '../../../test'

export const updateAsyncIssuanceContactMutation = graphql(`
  mutation UpdateAsyncIssuanceContact($asyncIssuanceRequestId: UUID!, $contact: AsyncIssuanceContactInput!) {
    updateAsyncIssuanceContact(asyncIssuanceRequestId: $asyncIssuanceRequestId, contact: $contact) {
      notification {
        value
        method
      }
      verification {
        value
        method
      }
    }
  }
`)

export async function updateAsyncIssuanceContact(asyncIssuanceRequestId: string, contact: AsyncIssuanceContactInput) {
  const { data, errors } = await executeOperationAsUser(
    {
      query: updateAsyncIssuanceContactMutation,
      variables: { asyncIssuanceRequestId, contact },
    },
    UserRoles.issuer,
  )

  if (errors) throw new Error(`Error while updating the async issuance contact: ${JSON.stringify(errors)}`)
  if (!data) throw new Error('No data returned')

  return data.updateAsyncIssuanceContact
}
