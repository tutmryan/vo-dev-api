import { randomUUID } from 'crypto'
import { createPhotoCaptureRequest, createPhotoCaptureRequestMutation } from '.'
import { AppRoles, UserRoles } from '../../../roles'
import {
  beforeAfterAll,
  executeOperationAnonymous,
  executeOperationAsApp,
  executeOperationAsUser,
  expectUnauthorizedError,
} from '../../../test'

describe('createPhotoCaptureRequest mutation', () => {
  beforeAfterAll()

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
    expect(errors?.[0]?.message).toMatchInlineSnapshot(
      `"Variable "$request" got invalid value "123" at "request.contractId"; Value is not a valid UUID: 123"`,
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
  })
})
