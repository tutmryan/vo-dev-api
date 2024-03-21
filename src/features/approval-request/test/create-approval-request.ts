import { addDays, startOfToday } from 'date-fns'
import { graphql } from '../../../generated'
import type { ApprovalRequestInput } from '../../../generated/graphql'
import { AppRoles } from '../../../roles'
import { executeOperationAsApp } from '../../../test'

export const createApprovalRequestMutation = graphql(
  `
  mutation CreateApprovalRequest($input: ApprovalRequestInput!) {
    createApprovalRequest(request: $input) {
      id
      portalUrl
    }
  }
` as const,
)

export function getDefaultApprovalRequestInput(): ApprovalRequestInput {
  return {
    expiresAt: addDays(startOfToday(), 5),
    requestType: 'test',
    purpose: 'Approve a change',
    presentationRequestInput: {
      requestedCredentials: [
        {
          type: 'verifiedContractor',
          acceptedIssuers: ['did:example:123'],
        },
      ],
      registration: {
        clientName: 'Approval App',
        purpose: 'Approve a change',
      },
    },
  }
}

export async function createApprovalRequest(input: ApprovalRequestInput) {
  const { data, errors } = await executeOperationAsApp(
    {
      query: createApprovalRequestMutation,
      variables: {
        input,
      },
    },
    AppRoles.requestApproval,
  )

  if (errors) {
    throw new Error(`Error while creating an approval request: ${JSON.stringify(errors)}`)
  }

  return data!.createApprovalRequest
}
