import { graphql } from '../../../generated'
import { ApprovalRequestStatus } from '../../../generated/graphql'
import { AppRoles } from '../../../roles'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsApp, expectUnauthorizedError } from '../../../test'
import { mockedServices } from '../../../test/mocks'
import { createActionedApprovalRequest, createApprovalRequest, getDefaultApprovalRequestInput } from './create-approval-request'

export const findActionedApprovalDataQuery = graphql(
  `
  query FindActionedApprovalData($id: ID!) {
    actionedApprovalData(id: $id) {
      approvalRequestId
      correlationId
      requestData
      state
      status
      actionedComment
      actionedAt
      actionedBy {
        id
        name
      }
      callbackSecret
    }
  }` as const,
)

describe('find actioned approval data', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()
    mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
      mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
    )
  })
  it('returns null for pending approval requests', async () => {
    // Arrange
    const approvalRequest = await createApprovalRequest(getDefaultApprovalRequestInput())

    // Act
    const { data } = await executeOperationAsApp(
      {
        query: findActionedApprovalDataQuery,
        variables: { id: approvalRequest.id },
      },
      AppRoles.requestApproval,
    )

    // Assert
    expect(data?.actionedApprovalData).toBeNull()
  })

  it('returns unauthorised when accessed anonymously', async () => {
    // Arrange

    const approvalRequest = await createApprovalRequest(getDefaultApprovalRequestInput())
    // Act
    const { errors } = await executeOperationAnonymous({
      query: findActionedApprovalDataQuery,
      variables: { id: approvalRequest.id },
    })
    // Assert
    expectUnauthorizedError(errors)
  })

  it('returns details for an actioned approval requests', async () => {
    // Arrange
    const { approvalRequest, identity } = await createActionedApprovalRequest(getDefaultApprovalRequestInput(), true, 'Approved')

    // Act
    const { data } = await executeOperationAsApp(
      {
        query: findActionedApprovalDataQuery,
        variables: { id: approvalRequest.id },
      },
      AppRoles.requestApproval,
    )

    // Assert
    expect(data?.actionedApprovalData).not.toBeNull()
    expect(data?.actionedApprovalData?.approvalRequestId).toEqual(approvalRequest.id)
    expect(data?.actionedApprovalData?.status).toEqual(ApprovalRequestStatus.Approved)
    expect(data?.actionedApprovalData?.actionedBy?.id).toEqual(identity.id)
  })
})
