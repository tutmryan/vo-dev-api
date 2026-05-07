import { addDays, startOfToday } from 'date-fns'
import { isMDocPresentationsEnabled } from '../../../cqs/feature-map'
import { graphql } from '../../../generated'
import { ContactMethod, type MDocPresentationFlowInput } from '../../../generated/graphql'
import { AppRoles, UserRoles } from '../../../roles'
import {
  beforeAfterAll,
  buildJwt,
  executeOperation,
  executeOperationAnonymous,
  executeOperationAsApp,
  expectUnauthorizedError,
} from '../../../test'
import { mockedServices } from '../../../test/mocks'
import { createIdentity } from '../../identity/tests/create-identity'

jest.mock('../../../cqs/feature-map', () => ({
  ...jest.requireActual('../../../cqs/feature-map'),
  isMDocPresentationsEnabled: jest.fn(),
}))

const isMDocPresentationsEnabledMock = isMDocPresentationsEnabled as jest.MockedFunction<typeof isMDocPresentationsEnabled>

const createMDocPresentationFlowMutation = graphql(
  `
    mutation CreateMDocPresentationFlowTest($request: MDocPresentationFlowInput!) {
      createMDocPresentationFlow(request: $request) {
        callbackSecret
        request {
          id
          portalUrl
          type
          hasContactNotificationSet
          notificationStatus
          dataSchema {
            id
            type
            label
            required
          }
        }
      }
    }
  ` as const,
)

async function getDefaultMDocInput(): Promise<MDocPresentationFlowInput> {
  const identity = await createIdentity()
  return {
    identityId: identity.id,
    expiresAt: addDays(startOfToday(), 5),
    title: 'Test mDoc presentation flow',
    mdocRequest: {
      docType: 'org.iso.18013.5.1.mDL',
      requestedClaims: [{ path: ['org.iso.18013.5.1', 'family_name'], intentToRetain: false }],
    },
  }
}

describe('createMDocPresentationFlow mutation', () => {
  beforeAfterAll()

  beforeEach(() => {
    isMDocPresentationsEnabledMock.mockImplementation(() => {
      throw new Error('ISO 18013-5 (mDL) presentation feature is not available')
    })
  })

  it('returns an unauthorized error when accessed anonymously', async () => {
    const { errors } = await executeOperationAnonymous({
      query: createMDocPresentationFlowMutation,
      variables: { request: await getDefaultMDocInput() },
    })

    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns an error when using the wrong role', async () => {
    const { errors } = await executeOperationAsApp(
      {
        query: createMDocPresentationFlowMutation,
        variables: { request: await getDefaultMDocInput() },
      },
      AppRoles.issue,
    )

    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns an error when mdoc feature is disabled', async () => {
    // The test environment has mdoc.presentationsEnabled = false by default
    const { errors } = await executeOperationAsApp(
      {
        query: createMDocPresentationFlowMutation,
        variables: { request: await getDefaultMDocInput() },
      },
      AppRoles.presentationFlowCreate,
    )

    expect(errors).toBeDefined()
    expect(errors![0]?.message).toMatch(/mDL|mDoc|ISO 18013/i)
  })

  describe('with mdoc feature enabled', () => {
    beforeEach(() => {
      isMDocPresentationsEnabledMock.mockImplementation(() => undefined)
    })

    it('creates successfully with type=mdoc when feature is enabled', async () => {
      const input = await getDefaultMDocInput()

      const { data, errors } = await executeOperationAsApp(
        {
          query: createMDocPresentationFlowMutation,
          variables: { request: input },
        },
        AppRoles.presentationFlowCreate,
      )

      expect(errors).toBeUndefined()
      expect(data?.createMDocPresentationFlow.request.id).toBeTruthy()
      expect(data?.createMDocPresentationFlow.request.type).toBe('mdoc')
      expect(data?.createMDocPresentationFlow.request.portalUrl).toContain(data?.createMDocPresentationFlow.request.id)
      expect(data?.createMDocPresentationFlow.callbackSecret).toBeTruthy()
    })

    it('populates dataSchema from requested claims when feature is enabled', async () => {
      const input = await getDefaultMDocInput()
      // getDefaultMDocInput() includes a single requested claim (family_name); use a richer set here
      input.mdocRequest = {
        docType: 'org.iso.18013.5.1.mDL',
        requestedClaims: [
          { path: ['org.iso.18013.5.1', 'family_name'], intentToRetain: false },
          { path: ['org.iso.18013.5.1', 'given_name'], intentToRetain: true },
        ],
      }

      const { data, errors } = await executeOperationAsApp(
        {
          query: createMDocPresentationFlowMutation,
          variables: { request: input },
        },
        AppRoles.presentationFlowCreate,
      )

      expect(errors).toBeUndefined()
      const schema = data?.createMDocPresentationFlow.request.dataSchema
      expect(schema).toBeDefined()
      expect(schema).toHaveLength(2)
      expect(schema![0]).toMatchObject({ id: 'org.iso.18013.5.1/family_name', type: 'text', label: 'family_name', required: false })
      expect(schema![1]).toMatchObject({ id: 'org.iso.18013.5.1/given_name', type: 'text', label: 'given_name', required: false })
    })

    it('creates successfully with user role presentationFlowCreate when feature is enabled', async () => {
      const input = await getDefaultMDocInput()
      const jwt = buildJwt({ roles: [UserRoles.presentationFlowCreate] })

      const { data, errors } = await executeOperation(
        {
          query: createMDocPresentationFlowMutation,
          variables: { request: input },
        },
        jwt,
      )

      expect(errors).toBeUndefined()
      expect(data?.createMDocPresentationFlow.request.type).toBe('mdoc')
    })

    it('returns an error when no claims are requested', async () => {
      const input = await getDefaultMDocInput()
      input.mdocRequest.requestedClaims = []

      const { errors } = await executeOperationAsApp(
        {
          query: createMDocPresentationFlowMutation,
          variables: { request: input },
        },
        AppRoles.presentationFlowCreate,
      )

      expect(errors).toBeDefined()
      expect(errors![0]?.message).toMatch(/at least one claim/i)
    })
  })

  describe('with contact notification', () => {
    beforeEach(() => {
      mockedServices.clearAllMocks()
      isMDocPresentationsEnabledMock.mockImplementation(() => undefined)
    })

    it('creates mDoc presentation flow with contact and queues notification job', async () => {
      const input = await getDefaultMDocInput()
      input.contact = {
        notification: {
          method: ContactMethod.Email,
          value: 'test@example.com',
        },
      }

      const { data, errors } = await executeOperationAsApp(
        {
          query: createMDocPresentationFlowMutation,
          variables: { request: input },
        },
        AppRoles.presentationFlowCreate,
      )

      expect(errors).toBeUndefined()
      expect(data?.createMDocPresentationFlow.request.hasContactNotificationSet).toBe(true)
    })
  })
})
