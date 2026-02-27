import { randomUUID } from 'crypto'
import { graphql } from '../../../generated'
import { PresentationFlowStatus } from '../../../generated/graphql'
import { AppRoles, UserRoles } from '../../../roles'
import type { LimitedPresentationFlowOperationInput } from '../../../test'
import {
  beforeAfterAll,
  buildJwt,
  executeOperation,
  executeOperationAnonymous,
  executeOperationAsApp,
  executeOperationAsLimitedPresentationFlowClient,
  expectUnauthorizedError,
} from '../../../test'
import { createPresentationFlow, getDefaultPresentationFlowInput } from './helpers'

const presentationFlowQuery = graphql(`
  query PresentationFlowQueryTest($id: ID!) {
    presentationFlow(id: $id) {
      id
      title
      expiresAt
      prePresentationText
      postPresentationText
      requestData
      status
    }
  }
`)

describe('query presentation flow', () => {
  beforeAfterAll()

  it('returns unauthorised when accessed anonymously', async () => {
    const input = await getDefaultPresentationFlowInput()
    const result = await createPresentationFlow(input)

    const { errors } = await executeOperationAnonymous({
      query: presentationFlowQuery,
      variables: { id: result.request.id },
    })

    expectUnauthorizedError(errors)
  })

  it('returns unauthorised when using the wrong role', async () => {
    const input = await getDefaultPresentationFlowInput()
    const result = await createPresentationFlow(input)

    const { errors } = await executeOperationAsApp(
      {
        query: presentationFlowQuery,
        variables: { id: result.request.id },
      },
      AppRoles.issue,
    )

    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns presentation flow via limited presentation flow token', async () => {
    const input = await getDefaultPresentationFlowInput()
    const result = await createPresentationFlow(input)
    const limitedPresentationFlowInput: LimitedPresentationFlowOperationInput = {
      presentationFlowId: result.request.id,
      presentationId: randomUUID(),
    }

    const { data, errors } = await executeOperationAsLimitedPresentationFlowClient(
      {
        query: presentationFlowQuery,
        variables: { id: result.request.id },
      },
      limitedPresentationFlowInput,
    )

    expect(errors).toBeUndefined()
    expect(data).not.toBeNull()
    expect(data?.presentationFlow.id).toEqual(result.request.id)
    expect(data?.presentationFlow.status).toEqual(PresentationFlowStatus.Pending)
  })

  it('returns presentation flow via app role presentationFlowRead', async () => {
    const input = await getDefaultPresentationFlowInput()
    const result = await createPresentationFlow(input)

    const { data, errors } = await executeOperationAsApp(
      {
        query: presentationFlowQuery,
        variables: { id: result.request.id },
      },
      AppRoles.presentationFlowRead,
    )

    expect(errors).toBeUndefined()
    expect(data).not.toBeNull()
    expect(data?.presentationFlow.id).toEqual(result.request.id)
    expect(data?.presentationFlow.title).toEqual(input.title)
  })

  it('returns presentation flow via user role presentationFlowRead', async () => {
    const input = await getDefaultPresentationFlowInput()
    const result = await createPresentationFlow(input)
    const jwt = buildJwt({ roles: [UserRoles.presentationFlowRead] })

    const { data, errors } = await executeOperation(
      {
        query: presentationFlowQuery,
        variables: { id: result.request.id },
      },
      jwt,
    )

    expect(errors).toBeUndefined()
    expect(data).not.toBeNull()
    expect(data?.presentationFlow.id).toEqual(result.request.id)
  })
})
