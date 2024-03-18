import { addDays, startOfToday } from 'date-fns'
import { graphql } from '../../../generated'
import type { PresentationRequestInput } from '../../../generated/graphql'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsCredentialAdmin, expectUnauthorizedError } from '../../../test'

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

describe('provisionContract mutation', () => {
  beforeAfterAll()

  it('returns an errors when in an anonymous context', async () => {
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

  it('updates the contract with external id when provisioning for first time', async () => {
    // Act
    const { data, errors } = await executeOperationAsCredentialAdmin({
      query: createApprovalRequestMutation,
      variables: {
        input: sampleInput,
      },
    })

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
