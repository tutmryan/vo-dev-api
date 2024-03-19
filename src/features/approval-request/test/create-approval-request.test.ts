import { addDays, startOfToday } from 'date-fns'
import { graphql } from '../../../generated'
import type { PresentationRequestInput } from '../../../generated/graphql'
import { AppRoles } from '../../../shield'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsApp, expectUnauthorizedError } from '../../../test'

export const createApprovalRequestMutation = graphql(
  `
  mutation CreateApprovalRequest($input: ApprovalRequestInput!) {
    createApprovalRequest(request: $input) {
      id
      expiresAt
      requestType
      correlationId
      referenceUrl
      purpose
      presentationRequest
      requestData
      callback
      requestedAt
    }
  }
` as const,
)

const sampleInput = {
  expiresAt: addDays(startOfToday(), 5),
  requestType: 'test',
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

describe('create approval request mutation', () => {
  beforeAfterAll()

  it('returns an error when in an anonymous context', async () => {
    // Act
    const { errors } = await executeOperationAnonymous({
      query: createApprovalRequestMutation,
      variables: {
        input: sampleInput,
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns an error when using the wrong role', async () => {
    // Act
    const { errors } = await executeOperationAsApp(
      {
        query: createApprovalRequestMutation,
        variables: {
          input: sampleInput,
        },
      },
      AppRoles.issue,
    )

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('creates the approval request successfully', async () => {
    // Act
    const { data, errors } = await executeOperationAsApp(
      {
        query: createApprovalRequestMutation,
        variables: {
          input: sampleInput,
        },
      },
      AppRoles.requestApproval,
    )

    // Assert
    expect(errors).toBeUndefined()
    expect(data).not.toBeNull()
    expect(data?.createApprovalRequest.id).not.toBeNull()
    expect(data?.createApprovalRequest.expiresAt).toEqual(sampleInput.expiresAt)
    expect((data?.createApprovalRequest.presentationRequest as PresentationRequestInput).requestedCredentials[0]?.type).toEqual(
      'verifiedContractor',
    )
  })
})
