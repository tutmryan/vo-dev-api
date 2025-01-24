import { graphql } from '../../../generated'
import { UserRoles } from '../../../roles'
import { executeOperationAsUser } from '../../../test'

graphql(`
  fragment AsyncIssuanceRequestFragment on AsyncIssuanceRequest {
    id
    status
    isStatusFinal
    failureReason
    expiry
    expiresOn
    createdAt
    updatedAt
    identity {
      id
    }
    issuance {
      id
    }
    createdBy {
      id
    }
    updatedBy {
      id
    }
  }
`)

export const getAsyncIssuanceQuery = graphql(`
  query GetAsyncIssuance($id: UUID!) {
    asyncIssuanceRequest(id: $id) {
      ...AsyncIssuanceRequestFragment
    }
  }
`)

export async function getAsyncIssuance(id: string) {
  const { data, errors } = await executeOperationAsUser(
    {
      query: getAsyncIssuanceQuery,
      variables: { id },
    },
    UserRoles.issuer,
  )

  if (errors) throw new Error(`Error while getting the async issuance: ${JSON.stringify(errors)}`)
  if (!data) throw new Error('No data returned')

  return data.asyncIssuanceRequest
}
