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
  executeOperationAsLimitedPresentationFlowClient,
  expectUnauthorizedError,
} from '../../../test'
import { createPresentationFlow, createSubmittedPresentationFlow, getDefaultPresentationFlowInput } from './helpers'

const cancelPresentationFlowMutation = graphql(
  `
    mutation CancelPresentationFlowTest($id: ID!) {
      cancelPresentationFlow(id: $id)
    }
  ` as const,
)

const presentationFlowQuery = graphql(`
  query PresentationFlowTest($id: ID!) {
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

describe('cancel presentation flow mutation', () => {
  beforeAfterAll()

  it('returns an unauthorized error when accessed anonymously', async () => {
    // Arrange
    const input = await getDefaultPresentationFlowInput()
    const result = await createPresentationFlow(input)

    // Act
    const { errors } = await executeOperationAnonymous({
      query: cancelPresentationFlowMutation,
      variables: {
        id: result.request.id,
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns an error when using the wrong role', async () => {
    // Arrange
    const jwtWithWrongRole = buildJwt({ roles: [AppRoles.issue] })
    const input = await getDefaultPresentationFlowInput()
    const result = await createPresentationFlow(input)

    // Act
    const { errors } = await executeOperation(
      {
        query: cancelPresentationFlowMutation,
        variables: {
          id: result.request.id,
        },
      },
      jwtWithWrongRole,
    )

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns an error when cancelling submitted requests', async () => {
    // Arrange
    const cancelJwt = buildJwt({ roles: [AppRoles.presentationFlowCancel] })
    const input = await getDefaultPresentationFlowInput()
    const { presentationFlow } = await createSubmittedPresentationFlow(input)

    // Act
    const { errors } = await executeOperation(
      {
        query: cancelPresentationFlowMutation,
        variables: {
          id: presentationFlow.request.id,
        },
      },
      cancelJwt,
    )

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toContain('Only pending requests can be cancelled.')
  })

  it('cancels successfully with app role presentationFlowCancel', async () => {
    // Arrange
    const cancelJwt = buildJwt({ roles: [AppRoles.presentationFlowCancel] })
    const input = await getDefaultPresentationFlowInput()
    const result = await createPresentationFlow(input)

    // Act
    const { errors } = await executeOperation(
      {
        query: cancelPresentationFlowMutation,
        variables: {
          id: result.request.id,
        },
      },
      cancelJwt,
    )

    // Assert
    expect(errors).toBeUndefined()

    // read the request back to ensure it was updated
    {
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
      expect(data?.presentationFlow.status).toEqual(PresentationFlowStatus.Cancelled)
    }
  })

  it('cancels successfully with user role presentationFlowCancel', async () => {
    // Arrange
    const cancelJwt = buildJwt({ roles: [UserRoles.presentationFlowCancel] })
    const input = await getDefaultPresentationFlowInput()
    const result = await createPresentationFlow(input)

    // Act
    const { errors } = await executeOperation(
      {
        query: cancelPresentationFlowMutation,
        variables: { id: result.request.id },
      },
      cancelJwt,
    )

    // Assert
    expect(errors).toBeUndefined()
  })
})
