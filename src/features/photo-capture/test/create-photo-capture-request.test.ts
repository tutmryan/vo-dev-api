import { randomUUID } from 'crypto'
import { createPhotoCaptureRequest, createPhotoCaptureRequestMutation, setupPhotoCaptureData } from '.'
import { AppRoles, UserRoles } from '../../../roles'
import {
  beforeAfterAll,
  executeOperationAnonymous,
  executeOperationAsApp,
  executeOperationAsLimitedAccessClient,
  executeOperationAsUser,
  expectUnauthorizedError,
} from '../../../test'
import { mockedServices } from '../../../test/mocks'

describe('createPhotoCaptureRequest mutation', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()
    mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
      mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
    )
  })
  it('returns an unauthorized error when accessed anonymously', async () => {
    // Act
    const { errors } = await executeOperationAnonymous({
      query: createPhotoCaptureRequestMutation,
      variables: {
        request: {
          contractId: randomUUID(),
          identityId: randomUUID(),
        },
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns an unauthorized error when accessed with the wrong app roles', async () => {
    // Act
    const { errors } = await executeOperationAsApp(
      {
        query: createPhotoCaptureRequestMutation,
        variables: {
          request: {
            contractId: randomUUID(),
            identityId: randomUUID(),
          },
        },
      },
      AppRoles.present,
      AppRoles.requestApproval,
    )

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns an unauthorized error when accessed with the wrong user roles', async () => {
    // Act
    const { errors } = await executeOperationAsUser(
      {
        query: createPhotoCaptureRequestMutation,
        variables: {
          request: {
            contractId: randomUUID(),
            identityId: randomUUID(),
          },
        },
      },
      UserRoles.approvalRequestAdmin,
      UserRoles.credentialAdmin,
      UserRoles.partnerAdmin,
      UserRoles.reader,
    )

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns a validation error when invalid UUIDs are provided as input', async () => {
    // Act
    const { errors } = await executeOperationAsApp(
      {
        query: createPhotoCaptureRequestMutation,
        variables: {
          request: {
            contractId: '123',
            identityId: '456',
          },
        },
      },
      AppRoles.issue,
    )

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toBe(
      `Variable "$request" got invalid value "123" at "request.contractId"; Value is not a valid UUID: 123,
Variable "$request" got invalid value "456" at "request.identityId"; Value is not a valid UUID: 456`,
    )
  })

  it('returns an error when the contract ID is does not exist', async () => {
    // Act
    const { errors } = await executeOperationAsApp(
      {
        query: createPhotoCaptureRequestMutation,
        variables: {
          request: {
            contractId: randomUUID(),
            identityId: randomUUID(),
          },
        },
      },
      AppRoles.issue,
    )

    // Assert
    expect(errors).toBeDefined()
    expect(errors?.[0]?.message).toContain(`Could not find any entity of type "ContractEntity" matching`)
  })

  it('works when valid input is provided', async () => {
    // Arrange + Act
    const { data, errors } = await createPhotoCaptureRequest()

    // Assert
    expect(errors).toBeUndefined()
    expect(data?.createPhotoCaptureRequest).toMatchObject({
      id: expect.any(String),
      photoCaptureUrl: expect.stringMatching(/^https:\/\/test.portal.verifiedorchestration.com\/photo-capture\/(.*)$/),
      photoCaptureQrCode: expect.stringMatching(/^data:image\/png;base64,(.*)$/),
    })
  }, 15000)

  it('works as a limited access issuance app without specifying identityId', async () => {
    // Arrange
    const { contract, identity } = await setupPhotoCaptureData()

    // Act
    const { data, errors } = await executeOperationAsLimitedAccessClient(
      {
        query: createPhotoCaptureRequestMutation,
        variables: {
          request: {
            contractId: contract.id,
          },
        },
      },
      {
        issuableContractIds: [contract.id],
        identityId: identity.id,
      },
    )

    // Assert
    expect(errors).toBeUndefined()
    expect(data?.createPhotoCaptureRequest).toMatchObject({
      id: expect.any(String),
      photoCaptureUrl: expect.stringMatching(/^https:\/\/test.portal.verifiedorchestration.com\/photo-capture\/(.*)$/),
      photoCaptureQrCode: expect.stringMatching(/^data:image\/png;base64,(.*)$/),
    })
  })

  it('fails when a limited access app uses the wrong contractId', async () => {
    // Arrange
    const { contract, identity } = await setupPhotoCaptureData()

    // Act
    const { errors, data } = await executeOperationAsLimitedAccessClient(
      {
        query: createPhotoCaptureRequestMutation,
        variables: {
          request: {
            contractId: contract.id,
          },
        },
      },
      {
        issuableContractIds: [randomUUID()],
        identityId: identity.id,
      },
    )

    // Assert
    expect(data).toBeNull()
    expectUnauthorizedError(errors)
  })

  it('fails when a limited access app uses the wrong identityId', async () => {
    // Arrange
    const { contract, identity } = await setupPhotoCaptureData()

    // Act
    const { errors, data } = await executeOperationAsLimitedAccessClient(
      {
        query: createPhotoCaptureRequestMutation,
        variables: {
          request: {
            identityId: identity.id,
            contractId: contract.id,
          },
        },
      },
      {
        issuableContractIds: [contract.id],
        identityId: randomUUID(),
      },
    )

    // Assert
    expect(data).toBeNull()
    expectUnauthorizedError(errors)
  })
})
