import type { AsyncIssuanceRequestsOrderBy, AsyncIssuanceRequestsWhere, OrderDirection } from '@/generated/graphql'
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

const listAsyncIssuanceRequestsQuery = graphql(`
  query ListAsyncIssuanceRequests(
    $where: AsyncIssuanceRequestsWhere
    $offset: PositiveInt
    $limit: PositiveInt
    $orderBy: AsyncIssuanceRequestsOrderBy
    $orderDirection: OrderDirection
  ) {
    findAsyncIssuanceRequests(where: $where, offset: $offset, limit: $limit, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      identity {
        id
        identifier
        issuer
        issuerLabel
        name
      }
      contract {
        id
        name
      }
      createdAt
      createdBy {
        id
        name
        isApp
        email
      }
      status
      expiry
    }
  }
`)

export async function executeListAsyncIssuanceRequests(variables: {
  where?: AsyncIssuanceRequestsWhere
  limit?: number
  offset?: number
  orderBy?: AsyncIssuanceRequestsOrderBy
  orderDirection?: OrderDirection
}) {
  return executeOperationAsUser(
    {
      query: listAsyncIssuanceRequestsQuery,
      variables,
    },
    UserRoles.issuer,
  )
}
