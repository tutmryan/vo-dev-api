import type { JwtPayload } from '@makerx/graphql-core'
import casual from 'casual'
import { randomUUID } from 'crypto'
import { addDays, startOfToday } from 'date-fns'
import { ISOLATION_LEVEL, dataSource } from '../../../data'
import { addUserToManager } from '../../../data/user-context-helper'
import { graphql } from '../../../generated'
import type { PresentationFlowInput } from '../../../generated/graphql'
import { AppRoles } from '../../../roles'
import type { LimitedPresentationFlowOperationInput } from '../../../test'
import { executeOperation, executeOperationAsApp, executeOperationAsLimitedPresentationFlowClient } from '../../../test'
import { createIdentity } from '../../identity/tests/create-identity'
import { PresentationEntity } from '../../presentation/entities/presentation-entity'
import { UserEntity } from '../../users/entities/user-entity'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'

export const createPresentationFlowMutation = graphql(
  `
    mutation CreatePresentationFlowTest($request: PresentationFlowInput!) {
      createPresentationFlow(request: $request) {
        callbackSecret
        request {
          id
          portalUrl
        }
      }
    }
  ` as const,
)

export const submitPresentationFlowActionsMutation = graphql(
  `
    mutation SubmitPresentationFlowActionsTest($id: ID!, $input: SubmitActionsInput!) {
      submitPresentationFlowActions(id: $id, input: $input) {
        id
        status
        isSubmitted
        dataResults
      }
    }
  ` as const,
)

export async function getDefaultPresentationFlowInput(): Promise<PresentationFlowInput> {
  const identity = await createIdentity()
  return {
    identityId: identity.id,
    expiresAt: addDays(startOfToday(), 5),
    title: 'Test presentation flow',
    prePresentationText: 'Please present your credential',
    requestData: { test: true },
    presentationRequest: {
      registration: {
        clientName: 'VO Presentation Flow Test',
        purpose: 'Verify a credential',
      },
      requestedCredentials: [
        {
          type: 'verifiedContractor',
          acceptedIssuers: ['did:example:123'],
        },
      ],
    },
  }
}

export async function createPresentationFlow(input: PresentationFlowInput, jwt?: JwtPayload) {
  if (jwt) {
    const { data, errors } = await executeOperation(
      {
        query: createPresentationFlowMutation,
        variables: { request: input },
      },
      jwt,
    )
    if (errors) throw new Error(`Error while creating presentation flow: ${JSON.stringify(errors)}`)
    return data!.createPresentationFlow
  }

  const { data, errors } = await executeOperationAsApp(
    {
      query: createPresentationFlowMutation,
      variables: { request: input },
    },
    AppRoles.presentationFlowCreate,
  )
  if (errors) throw new Error(`Error while creating presentation flow: ${JSON.stringify(errors)}`)
  return data!.createPresentationFlow
}

async function createPresentationForPresentationFlow(presentationFlowId: string) {
  const identity = await createIdentity()
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
    const aprRepo = entityManager.getRepository(PresentationFlowEntity)
    const apr = await aprRepo.findOneByOrFail({ id: presentationFlowId })
    apr.presentationId = presentation.id
    await aprRepo.save(apr)
    return { presentation }
  })

  return { identity, presentation }
}

export async function createPresentationFlowWithPresentation(input: PresentationFlowInput, jwt?: JwtPayload) {
  const result = await createPresentationFlow(input, jwt)
  const { presentation, identity } = await createPresentationForPresentationFlow(result.request.id)

  return { presentationFlow: result, presentation, identity }
}

export async function createSubmittedPresentationFlow(
  input: PresentationFlowInput,
  dataResults: Record<string, unknown> = {},
  jwt?: JwtPayload,
) {
  const { presentation, identity, presentationFlow } = await createPresentationFlowWithPresentation(input, jwt)
  const limitedPresentationFlowInput: LimitedPresentationFlowOperationInput = {
    presentationFlowId: presentationFlow.request.id,
    presentationId: presentation.id,
  }
  const { data, errors } = await executeOperationAsLimitedPresentationFlowClient(
    {
      query: submitPresentationFlowActionsMutation,
      variables: { id: presentationFlow.request.id, input: { dataResults } },
    },
    limitedPresentationFlowInput,
  )

  return {
    presentationFlow,
    presentation,
    identity,
    submittedData: data?.submitPresentationFlowActions,
    errors,
  }
}
