import { graphql } from '../../../generated'
import { PresentationFlowStatus } from '../../../generated/graphql'
import { AppRoles } from '../../../roles'
import { beforeAfterAll, executeOperationAnonymous, executeOperationAsApp, expectUnauthorizedError } from '../../../test'
import { createPresentationFlow, createSubmittedPresentationFlow, getDefaultPresentationFlowInput } from './helpers'

export const findActionedPresentationFlowDataQuery = graphql(
  `
    query FindActionedPresentationFlowDataTest($id: ID!) {
      actionedPresentationFlowData(id: $id) {
        presentationFlowId
        requestData
        state
        status
        presentationId
        dataResults
        submittedAt
        submittedBy {
          id
          name
        }
        callbackSecret
      }
    }
  ` as const,
)

describe('find actioned presentation flow data', () => {
  beforeAfterAll()

  it('returns null for pending presentation flows', async () => {
    // Arrange
    const result = await createPresentationFlow(await getDefaultPresentationFlowInput())

    // Act
    const { data } = await executeOperationAsApp(
      {
        query: findActionedPresentationFlowDataQuery,
        variables: { id: result.request.id },
      },
      AppRoles.presentationFlowRead,
    )

    // Assert
    expect(data?.actionedPresentationFlowData).toBeNull()
  })

  it('returns unauthorised when using the wrong role', async () => {
    // Arrange
    const result = await createPresentationFlow(await getDefaultPresentationFlowInput())

    // Act
    const { errors } = await executeOperationAsApp(
      {
        query: findActionedPresentationFlowDataQuery,
        variables: { id: result.request.id },
      },
      AppRoles.issue,
    )

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns unauthorised when accessed anonymously', async () => {
    // Arrange
    const result = await createPresentationFlow(await getDefaultPresentationFlowInput())

    // Act
    const { errors } = await executeOperationAnonymous({
      query: findActionedPresentationFlowDataQuery,
      variables: { id: result.request.id },
    })

    // Assert
    expectUnauthorizedError(errors)
  })

  it('returns details for a submitted presentation flow', async () => {
    // Arrange
    const { presentationFlow } = await createSubmittedPresentationFlow(await getDefaultPresentationFlowInput(), {})

    // Act
    const { data } = await executeOperationAsApp(
      {
        query: findActionedPresentationFlowDataQuery,
        variables: { id: presentationFlow.request.id },
      },
      AppRoles.presentationFlowRead,
    )

    // Assert
    expect(data?.actionedPresentationFlowData).not.toBeNull()
    expect(data?.actionedPresentationFlowData?.presentationFlowId).toEqual(presentationFlow.request.id)
    expect(data?.actionedPresentationFlowData?.status).toEqual(PresentationFlowStatus.Submitted)
    expect(data?.actionedPresentationFlowData?.submittedBy).not.toBeNull()
    expect(data?.actionedPresentationFlowData?.submittedBy?.id).toBeTruthy()
    expect(data?.actionedPresentationFlowData?.submittedBy?.name).toBeTruthy()
  })
})
