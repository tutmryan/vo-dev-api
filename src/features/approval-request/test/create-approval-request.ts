import type { JwtPayload } from '@makerx/graphql-core'
import casual from 'casual'
import { randomUUID } from 'crypto'
import { addDays, startOfToday } from 'date-fns'
import { ISOLATION_LEVEL, dataSource } from '../../../data'
import { addUserToManager } from '../../../data/user-context-helper'
import { graphql } from '../../../generated'
import type { ApprovalRequestInput } from '../../../generated/graphql'
import { AppRoles } from '../../../roles'
import type { LimitedApprovalOperationInput } from '../../../test'
import { executeOperation, executeOperationAsApp, executeOperationAsLimitedApprovalClient } from '../../../test'
import { createContract, getDefaultContractInput } from '../../contracts/test/create-contract'
import { createIdentity } from '../../identity/tests/create-identity'
import { PresentationEntity } from '../../presentation/entities/presentation-entity'
import { UserEntity } from '../../users/entities/user-entity'
import { ApprovalRequestEntity } from '../entities/approval-request-entity'

export const createApprovalRequestMutation = graphql(
  `
  mutation CreateApprovalRequest($input: ApprovalRequestInput!) {
    createApprovalRequest(request: $input) {
      id
      portalUrl
      callbackSecret
    }
  }
` as const,
)

export const actionApprovalRequestMutation = graphql(
  `
    mutation ActionApprovalRequest($id: ID!, $input: ActionApprovalRequestInput!) {
      actionApprovalRequest(id: $id, input: $input) {
        id
        status
        isApproved
        actionedComment
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
    },
  }
}

export async function createApprovalRequest(input: ApprovalRequestInput, jwt?: JwtPayload) {
  if (jwt) {
    const { data, errors } = await executeOperation(
      {
        query: createApprovalRequestMutation,
        variables: {
          input,
        },
      },
      jwt,
    )
    if (errors) {
      throw new Error(`Error while creating an approval request: ${JSON.stringify(errors)}`)
    }

    return data!.createApprovalRequest
  }

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

export async function createApprovalRequestWithPresentation(input: ApprovalRequestInput, jwt?: JwtPayload) {
  const approvalRequest = await createApprovalRequest(input, jwt)
  const { presentation, identity } = await createPresentationForApprovalRequest(approvalRequest.id)

  return { approvalRequest, presentation, identity }
}

export async function createActionedApprovalRequest(
  input: ApprovalRequestInput,
  isApproved: boolean,
  actionedComment: string,
  createApprovalJwt?: JwtPayload,
) {
  const { presentation, identity, approvalRequest } = await createApprovalRequestWithPresentation(input, createApprovalJwt)
  const limitedApprovalInput: LimitedApprovalOperationInput = {
    approvalRequestId: approvalRequest.id,
    presentationId: presentation.id,
  }
  // Act
  const { data, errors } = await executeOperationAsLimitedApprovalClient(
    {
      query: actionApprovalRequestMutation,
      variables: { id: approvalRequest.id, input: { isApproved, actionedComment } },
    },
    limitedApprovalInput,
  )

  return {
    approvalRequest,
    presentation,
    identity,
    actionedApprovalData: data?.actionApprovalRequest,
    errors,
  }
}
