import { AppRoles, UserRoles } from '../../../roles'
import {
  beforeAfterAll,
  buildJwt,
  executeOperation,
  executeOperationAnonymous,
  executeOperationAsApp,
  expectUnauthorizedError,
} from '../../../test'
import { createPresentationFlowMutation, getDefaultPresentationFlowInput } from './helpers'

describe('create presentation flow mutation', () => {
  beforeAfterAll()

  it('returns an unauthorized error when accessed anonymously', async () => {
    const { errors } = await executeOperationAnonymous({
      query: createPresentationFlowMutation,
      variables: { request: await getDefaultPresentationFlowInput() },
    })

    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns an error when using the wrong role', async () => {
    const { errors } = await executeOperationAsApp(
      {
        query: createPresentationFlowMutation,
        variables: { request: await getDefaultPresentationFlowInput() },
      },
      AppRoles.issue,
    )

    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('creates successfully with app role presentationFlowCreate', async () => {
    const sampleInput = await getDefaultPresentationFlowInput()

    const { data, errors } = await executeOperationAsApp(
      {
        query: createPresentationFlowMutation,
        variables: { request: sampleInput },
      },
      AppRoles.presentationFlowCreate,
    )

    expect(errors).toBeUndefined()
    expect(data).not.toBeNull()
    expect(data?.createPresentationFlow.request.id).not.toBeNull()
    expect(data?.createPresentationFlow.request.portalUrl).toContain(data?.createPresentationFlow.request.id)
    expect(data?.createPresentationFlow.callbackSecret).toBeTruthy()
  })

  it('creates successfully with user role presentationFlowCreate', async () => {
    const sampleInput = await getDefaultPresentationFlowInput()
    const jwt = buildJwt({ roles: [UserRoles.presentationFlowCreate] })

    const { data, errors } = await executeOperation(
      {
        query: createPresentationFlowMutation,
        variables: { request: sampleInput },
      },
      jwt,
    )

    expect(errors).toBeUndefined()
    expect(data).not.toBeNull()
    expect(data?.createPresentationFlow.request.id).not.toBeNull()
  })
})
