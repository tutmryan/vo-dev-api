import { randomUUID } from 'crypto'
import { graphql } from '../../../generated'
import { AppRoles } from '../../../roles'
import {
  beforeAfterAll,
  buildJwt,
  executeOperation,
  executeOperationAnonymous,
  executeOperationAsLimitedApprovalClient,
  expectUnauthorizedError,
  LimitedApprovalOperationInput,
} from '../../../test'
import { mockedServices } from '../../../test/mocks'
import { createActionedApprovalRequest, createApprovalRequest, getDefaultApprovalRequestInput } from './create-approval-request'

const updateApprovalRequestMutation = graphql(
  `
    mutation UpdateApprovalRequest($id: ID!, $input: UpdateApprovalRequestInput!) {
      updateApprovalRequest(id: $id, input: $input)
    }
  ` as const,
)

const approvalRequestQuery = graphql(`
  query ApprovalRequest($approvalRequestId: ID!) {
    approvalRequest(id: $approvalRequestId) {
      id
      requestedAt
      expiresAt
      requestType
      correlationId
      referenceUrl
      purpose
      requestData
      actionedComment
      status
    }
  }
`)

describe('update approval request mutation', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()
    mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
      mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
    )
  })
  it('returns an unauthorized error when accessed anonymously', async () => {
    // Arrange
    const jwt = buildJwt({ roles: [AppRoles.requestApproval] })
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const approvalRequest = await createApprovalRequest(approvalRequestInput, jwt)
    // Act
    const { errors } = await executeOperationAnonymous({
      query: updateApprovalRequestMutation,
      variables: {
        id: approvalRequest.id,
        input: { purpose: 'new purpose', requestData: { test: 'test' } },
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns an error when using the wrong role', async () => {
    // Arrange
    const jwtWithWrongRole = buildJwt({ roles: [AppRoles.issue] })
    const approvalRequestInput = getDefaultApprovalRequestInput()

    // this should be created with the same jwt but we can't create the request with the wrong role!
    // still proves the point for the test though.
    const approvalRequest = await createApprovalRequest(approvalRequestInput)
    // Act
    const { errors } = await executeOperation(
      {
        query: updateApprovalRequestMutation,
        variables: {
          id: approvalRequest.id,
          input: { purpose: 'new purpose', requestData: { test: 'test' } },
        },
      },
      jwtWithWrongRole,
    )

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns an error when a updating completed requests', async () => {
    // Arrange
    const jwt = buildJwt({ roles: [AppRoles.requestApproval] })
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const approvalRequest = await createActionedApprovalRequest(approvalRequestInput, true, 'approved', jwt)

    // Act
    const { errors } = await executeOperation(
      {
        query: updateApprovalRequestMutation,
        variables: {
          id: approvalRequest.approvalRequest.id,
          input: { purpose: 'new purpose', requestData: { test: 'test' } },
        },
      },
      jwt,
    )

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toContain('Only pending requests can be updated.')
  })

  it('returns an error when a user other than the creator tries to update', async () => {
    // Arrange
    const jwt1 = buildJwt({ roles: [AppRoles.requestApproval] })
    const jwt2 = buildJwt({ roles: [AppRoles.requestApproval] })
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const approvalRequest = await createApprovalRequest(approvalRequestInput, jwt1)

    // Act
    const { errors } = await executeOperation(
      {
        query: updateApprovalRequestMutation,
        variables: {
          id: approvalRequest.id,
          input: { purpose: 'new purpose', requestData: { test: 'test' } },
        },
      },
      jwt2,
    )

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toContain('User does not have permission to update this approval request')
  })

  it('updates the approval request successfully', async () => {
    // Arrange
    const jwt = buildJwt({ roles: [AppRoles.requestApproval] })
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const approvalRequest = await createApprovalRequest(approvalRequestInput, jwt)

    // Act
    const { errors } = await executeOperation(
      {
        query: updateApprovalRequestMutation,
        variables: {
          id: approvalRequest.id,
          input: { purpose: 'new purpose', requestData: { test: 'test' } },
        },
      },
      jwt,
    )

    // Assert
    expect(errors).toBeUndefined()

    // read the approval request back to ensure it was updated
    {
      const limitedApprovalInput: LimitedApprovalOperationInput = {
        approvalRequestId: approvalRequest.id,
        presentationId: randomUUID(),
      }
      const { data, errors } = await executeOperationAsLimitedApprovalClient(
        {
          query: approvalRequestQuery,
          variables: { approvalRequestId: approvalRequest.id },
        },
        limitedApprovalInput,
      )

      expect(errors).toBeUndefined()
      expect(data).not.toBeNull()
      expect(data?.approvalRequest.id).toEqual(approvalRequest.id)
      expect(data?.approvalRequest.purpose).toEqual('new purpose')
      expect(data?.approvalRequest.requestData).toEqual({ test: 'test' })
    }
  })
})
