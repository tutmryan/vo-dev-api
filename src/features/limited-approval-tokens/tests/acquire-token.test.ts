import { randomUUID } from 'crypto'
import { startOfToday } from 'date-fns'
import { getLimitedApprovalData } from '..'
import { graphql } from '../../../generated'
import type { ApprovalTokenResponse } from '../../../generated/graphql'
import { ApprovalRequestStatus } from '../../../generated/graphql'
import { beforeAfterAll, executeOperationAnonymous } from '../../../test'
import { createApprovalRequest, getDefaultApprovalRequestInput } from '../../approval-request/test/create-approval-request'

const getClientCredentialsTokenMock = jest.fn(() => ({ access_token: randomUUID(), expires: 1000 * 60 * 50 }))
jest.mock('@makerx/node-common', () => {
  const originalModule = jest.requireActual('@makerx/node-common')
  return {
    ...originalModule,
    get getClientCredentialsToken() {
      return getClientCredentialsTokenMock
    },
  }
})

export const acquireLimitedApprovalTokenMutation = graphql(`
  mutation AcquireLimitedApprovalToken($input: AcquireLimitedApprovalTokenInput!) {
    acquireLimitedApprovalToken(input: $input) {
      token
      expires
    }
  }
`)

export function expectApprovalToken(approvalTokenResponse?: ApprovalTokenResponse): asserts approvalTokenResponse {
  expect(approvalTokenResponse).toMatchObject({ expires: expect.any(Date), token: expect.any(String) })
}

describe('limited approval token acquisition', () => {
  beforeAfterAll()

  it('fails when approval request does not exists', async () => {
    const { errors } = await executeOperationAnonymous({
      query: acquireLimitedApprovalTokenMutation,
      variables: { input: { approvalRequestId: randomUUID() } },
    })
    expect(errors).toBeDefined()
  })

  it('fails when approval request is no longer pending', async () => {
    // Arrange
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const request = await createApprovalRequest({ ...approvalRequestInput, expiresAt: startOfToday() })
    expect(request.status).toEqual(ApprovalRequestStatus.Expired)

    // Act
    const { errors } = await executeOperationAnonymous({
      query: acquireLimitedApprovalTokenMutation,
      variables: { input: { approvalRequestId: randomUUID() } },
    })

    // Assert
    expect(errors).toBeDefined()
  })

  it('returns a token when approval request is pending', async () => {
    // Arrange
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const approvalRequest = await createApprovalRequest(approvalRequestInput)

    // Act
    const { data, errors } = await executeOperationAnonymous({
      query: acquireLimitedApprovalTokenMutation,
      variables: { input: { approvalRequestId: approvalRequest.id } },
    })

    // Assert
    expect(errors).toBeUndefined()
    expect(data?.acquireLimitedApprovalToken.token).toBeTruthy()
    expectApprovalToken(data?.acquireLimitedApprovalToken)

    const tokenData = await getLimitedApprovalData(data!.acquireLimitedApprovalToken.token)
    expect(tokenData.userId).toBeTruthy()
  })
})
