import casual from 'casual'
import { randomUUID } from 'crypto'
import { addDays } from 'date-fns'
import { ISOLATION_LEVEL, dataSource } from '../../../data'
import { graphql } from '../../../generated'
import { ApprovalRequestStatus } from '../../../generated/graphql'
import type { LimitedApprovalOperationInput } from '../../../test'
import { beforeAfterAll, executeOperationAsLimitedApprovalClient, expectToBeDefined, expectUnauthorizedError } from '../../../test'
import { addUserToManager } from '../../auditing/user-context-helper'
import { createContract, getDefaultContractInput } from '../../contracts/test/create-contract'
import { createIdentity } from '../../identity/create-update-identity.test'
import { PresentationEntity } from '../../presentation/entities/presentation-entity'
import { UserEntity } from '../../users/entities/user-entity'
import { ApprovalRequestEntity } from '../entities/approval-request-entity'
import { createApprovalRequest, getDefaultApprovalRequestInput } from './create-approval-request'

const actionApprovalRequestMutation = graphql(`
  mutation ActionApprovalRequest($id: ID!, $input: ActionApprovalRequestInput!) {
    actionApprovalRequest(id: $id, input: $input) {
      id
      status
      isApproved
      actionedComment
    }
  }
`)

async function createPresentationForApprovalRequest(approvalRequestId: string) {
  const identity = await createIdentity()
  const contract = await createContract(getDefaultContractInput())
  const { presentation } = await dataSource.manager.transaction(ISOLATION_LEVEL, async (entityManager) => {
    const requestedBy = await entityManager
      .getRepository(UserEntity)
      .save(new UserEntity({ email: casual.email, isApp: true, name: 'Test', oid: randomUUID(), tenantId: randomUUID() }))
    addUserToManager(entityManager, requestedBy.id)
    const presentation = await entityManager.getRepository(PresentationEntity).save(
      new PresentationEntity({
        requestId: randomUUID(),
        identityId: identity.id,
        requestedById: requestedBy.id,
        requestedCredentials: [],
        presentedCredentials: [],
        partnerIds: [],
        issuanceIds: [],
      }),
    )
    const approvalRequestRepo = entityManager.getRepository(ApprovalRequestEntity)
    const approvalRequest = await approvalRequestRepo.findOneByOrFail({ id: approvalRequestId })
    approvalRequest.presentationId = presentation.id
    await approvalRequestRepo.save(approvalRequest)
    return { presentation }
  })

  return { identity, contract, presentation }
}

describe('action approval request', () => {
  beforeAfterAll()

  it('can be approved', async () => {
    // Arrange
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const approvalRequest = await createApprovalRequest(approvalRequestInput)
    const { presentation } = await createPresentationForApprovalRequest(approvalRequest.id)
    const limitedApprovalInput: LimitedApprovalOperationInput = {
      approvalRequestId: approvalRequest.id,
      presentationId: presentation.id,
    }
    // Act
    const { data, errors } = await executeOperationAsLimitedApprovalClient(
      {
        query: actionApprovalRequestMutation,
        variables: { id: approvalRequest.id, input: { isApproved: true, actionedComment: 'I hereby approve this request' } },
      },
      limitedApprovalInput,
    )
    // Assert
    expect(errors).toBeUndefined()
    expect(data).not.toBeNull()
    expect(data?.actionApprovalRequest.id.toLowerCase()).toEqual(approvalRequest.id)
    expect(data?.actionApprovalRequest.status).toEqual(ApprovalRequestStatus.Approved)
    expect(data?.actionApprovalRequest.isApproved).toEqual(true)
    expect(data?.actionApprovalRequest.actionedComment).toEqual('I hereby approve this request')
  })

  it('can be rejected', async () => {
    // Arrange
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const approvalRequest = await createApprovalRequest(approvalRequestInput)
    const { presentation } = await createPresentationForApprovalRequest(approvalRequest.id)
    const limitedApprovalInput: LimitedApprovalOperationInput = {
      approvalRequestId: approvalRequest.id,
      presentationId: presentation.id,
    }
    // Act
    const { data, errors } = await executeOperationAsLimitedApprovalClient(
      {
        query: actionApprovalRequestMutation,
        variables: { id: approvalRequest.id, input: { isApproved: false, actionedComment: 'I cannot approve this request' } },
      },
      limitedApprovalInput,
    )
    // Assert
    expect(errors).toBeUndefined()
    expect(data).not.toBeNull()
    expect(data?.actionApprovalRequest.id.toLowerCase()).toEqual(approvalRequest.id)
    expect(data?.actionApprovalRequest.status).toEqual(ApprovalRequestStatus.Rejected)
    expect(data?.actionApprovalRequest.isApproved).toEqual(false)
    expect(data?.actionApprovalRequest.actionedComment).toEqual('I cannot approve this request')
  })

  it('returns unauthorised when no presentation has been made', async () => {
    // Arrange
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const approvalRequest = await createApprovalRequest(approvalRequestInput)
    const limitedApprovalInput: LimitedApprovalOperationInput = {
      approvalRequestId: approvalRequest.id,
    }
    // Act
    const { errors } = await executeOperationAsLimitedApprovalClient(
      {
        query: actionApprovalRequestMutation,
        variables: { id: approvalRequest.id, input: { isApproved: true, actionedComment: 'I hereby approve this request' } },
      },
      limitedApprovalInput,
    )
    // Assert
    expectUnauthorizedError(errors)
  })

  it('returns an error when request is not pending', async () => {
    // Arrange
    const approvalRequestInput = getDefaultApprovalRequestInput()
    const approvalRequest = await createApprovalRequest(approvalRequestInput)
    const { presentation } = await createPresentationForApprovalRequest(approvalRequest.id)
    const limitedApprovalInput: LimitedApprovalOperationInput = {
      approvalRequestId: approvalRequest.id,
      presentationId: presentation.id,
    }
    await executeOperationAsLimitedApprovalClient(
      {
        query: actionApprovalRequestMutation,
        variables: { id: approvalRequest.id, input: { isApproved: true, actionedComment: 'I hereby approve this request' } },
      },
      limitedApprovalInput,
    )
    // Act
    const { errors } = await executeOperationAsLimitedApprovalClient(
      {
        query: actionApprovalRequestMutation,
        variables: { id: approvalRequest.id, input: { isApproved: true, actionedComment: 'I hereby approve this request again' } },
      },
      limitedApprovalInput,
    )
    // Assert
    expectToBeDefined(errors)
    expectToBeDefined(errors[0])
    expect(errors[0].message).toMatchInlineSnapshot(`"Cannot action an approval request that is approved"`)
  })

  it('returns an error when request is expired', async () => {
    // Arrange
    const approvalRequestInput = getDefaultApprovalRequestInput()
    approvalRequestInput.expiresAt = addDays(new Date(), -1)
    const approvalRequest = await createApprovalRequest(approvalRequestInput)
    const { presentation } = await createPresentationForApprovalRequest(approvalRequest.id)
    const limitedApprovalInput: LimitedApprovalOperationInput = {
      approvalRequestId: approvalRequest.id,
      presentationId: presentation.id,
    }
    // Act
    const { errors } = await executeOperationAsLimitedApprovalClient(
      {
        query: actionApprovalRequestMutation,
        variables: { id: approvalRequest.id, input: { isApproved: true, actionedComment: 'I hereby approve this request' } },
      },
      limitedApprovalInput,
    )
    // Assert
    expectToBeDefined(errors)
    expectToBeDefined(errors[0])
    expect(errors[0].message).toMatchInlineSnapshot(`"Cannot action an approval request that is expired"`)
  })
})
