import { randomUUID } from 'crypto'
import { capturePhotoMutation, createPhotoCaptureRequest, setupPhotoCaptureData, validPhotoDataUrl } from '.'
import { graphql } from '../../../generated'
import { PhotoCaptureStatus } from '../../../generated/graphql'
import { AppRoles } from '../../../roles'
import {
  beforeAfterAll,
  executeOperationAnonymous,
  executeOperationAsApp,
  executeOperationAsLimitedPhotoCaptureClient,
  expectToBeDefined,
  expectUnauthorizedError,
} from '../../../test'
import { acquireLimitedPhotoCaptureTokenMutation } from '../../limited-photo-capture-tokens/test'

const getClientCredentialsTokenMock = jest.fn(() => ({ access_token: randomUUID(), expires: 1000 * 60 * 50 }))
jest.mock('@makerx/node-common', () => {
  const originalModule = jest.requireActual('@makerx/node-common')
  return {
    ...originalModule,
    get getClientCredentialsToken() {
      return getClientCredentialsTokenMock
    },
  }
})

const photoCaptureStatusQuery = graphql(`
  query PhotoCaptureStatus($photoCaptureRequestId: UUID!) {
    photoCaptureStatus(photoCaptureRequestId: $photoCaptureRequestId) {
      status
    }
  }
`)

describe('photoCaptureStatus query', () => {
  beforeAfterAll()

  it('returns the correct statuses', async () => {
    // Initial setup
    const {
      contract: { id: contractId },
      identity: { id: identityId },
    } = await setupPhotoCaptureData()
    const photoCaptureRequest = await createPhotoCaptureRequest()
    const { id: photoCaptureRequestId } = expectToBeDefined(photoCaptureRequest.data?.createPhotoCaptureRequest)

    // Photo capture request created - test initial status
    const { data: initialData } = await executeOperationAsApp(
      {
        query: photoCaptureStatusQuery,
        variables: {
          photoCaptureRequestId,
        },
      },
      AppRoles.issue,
    )
    expect(initialData?.photoCaptureStatus.status).toBe(PhotoCaptureStatus.NotStarted)

    // Acquire token, test next status
    await executeOperationAnonymous({
      query: acquireLimitedPhotoCaptureTokenMutation,
      variables: { input: { photoCaptureRequestId } },
    })
    const { data: startedData } = await executeOperationAsApp(
      {
        query: photoCaptureStatusQuery,
        variables: {
          photoCaptureRequestId,
        },
      },
      AppRoles.issue,
    )
    expect(startedData?.photoCaptureStatus.status).toBe(PhotoCaptureStatus.Started)

    // Capture photo, test final status
    await executeOperationAsLimitedPhotoCaptureClient(
      {
        query: capturePhotoMutation,
        variables: {
          photoCaptureRequestId,
          photo: validPhotoDataUrl,
        },
      },
      {
        contractId,
        identityId,
        photoCaptureRequestId,
      },
    )
    const { data: completeData } = await executeOperationAsApp(
      {
        query: photoCaptureStatusQuery,
        variables: {
          photoCaptureRequestId,
        },
      },
      AppRoles.issue,
    )
    expect(completeData?.photoCaptureStatus.status).toBe(PhotoCaptureStatus.Complete)
  })

  it('prevents anonymous access', async () => {
    // Arrange
    await setupPhotoCaptureData()
    const photoCaptureRequest = await createPhotoCaptureRequest()
    const { id: photoCaptureRequestId } = expectToBeDefined(photoCaptureRequest.data?.createPhotoCaptureRequest)

    // Act
    const { data, errors } = await executeOperationAnonymous({
      query: photoCaptureStatusQuery,
      variables: {
        photoCaptureRequestId,
      },
    })

    // Assert
    expectUnauthorizedError(errors)
    expect(data).toBeNull()
  })
})
