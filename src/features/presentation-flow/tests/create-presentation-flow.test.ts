import casual from 'casual'
import { AppRoles, UserRoles } from '../../../roles'
import { ContactMethod } from '../../../generated/graphql'
import {
  beforeAfterAll,
  buildJwt,
  executeOperation,
  executeOperationAnonymous,
  executeOperationAsApp,
  expectUnauthorizedError,
} from '../../../test'
import { mockedServices } from '../../../test/mocks'
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

  describe('with contact notification', () => {
    beforeEach(() => {
      mockedServices.clearAllMocks()
    })

    it('creates presentation flow with email contact and queues notification job', async () => {
      // Arrange
      const sampleInput = await getDefaultPresentationFlowInput()
      sampleInput.contact = {
        notification: {
          method: ContactMethod.Email,
          value: casual.email,
        },
      }

      // Act
      const { data, errors } = await executeOperationAsApp(
        {
          query: createPresentationFlowMutation,
          variables: { request: sampleInput },
        },
        AppRoles.presentationFlowCreate,
      )

      // Assert
      expect(errors).toBeUndefined()
      expect(data).not.toBeNull()
      expect(data?.createPresentationFlow.request.id).not.toBeNull()
    })

    it('creates presentation flow with sms contact and queues notification job', async () => {
      // Arrange
      const sampleInput = await getDefaultPresentationFlowInput()
      sampleInput.contact = {
        notification: {
          method: ContactMethod.Sms,
          value: '+61412345678',
        },
      }

      // Act
      const { data, errors } = await executeOperationAsApp(
        {
          query: createPresentationFlowMutation,
          variables: { request: sampleInput },
        },
        AppRoles.presentationFlowCreate,
      )

      // Assert
      expect(errors).toBeUndefined()
      expect(data).not.toBeNull()
      expect(data?.createPresentationFlow.request.id).not.toBeNull()
    })

    it('creates presentation flow without contact and does not queue notification job', async () => {
      // Arrange
      const sampleInput = await getDefaultPresentationFlowInput()
      // Do not set contact

      // Act
      const { data, errors } = await executeOperationAsApp(
        {
          query: createPresentationFlowMutation,
          variables: { request: sampleInput },
        },
        AppRoles.presentationFlowCreate,
      )

      // Assert
      expect(errors).toBeUndefined()
      expect(data).not.toBeNull()
      expect(data?.createPresentationFlow.request.id).not.toBeNull()
    })
  })
})
