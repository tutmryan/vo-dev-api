import { randomUUID } from 'crypto'
import { capturePhotoMutation, createPhotoCaptureRequest, setupPhotoCaptureData } from '.'
import { AppRoles, UserRoles } from '../../../roles'
import {
  beforeAfterAll,
  executeOperationAnonymous,
  executeOperationAsApp,
  executeOperationAsLimitedPhotoCaptureClient,
  executeOperationAsUser,
  expectToBeDefined,
  expectUnauthorizedError,
} from '../../../test'
import { acquireLimitedPhotoCaptureTokenMutation } from '../../limited-photo-capture-tokens/test'

const validPhotoDataUrl = 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAATYAAAE2CAYAAADrvL6pAAAACXBI'
const pngPhotoDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAATYAAAE2CAYAAADrvL6pAAAACXBI'

describe('capturePhoto mutation', () => {
  beforeAfterAll()

  it('returns an unauthorized error when accessed anonymously', async () => {
    // Act
    const { errors } = await executeOperationAnonymous({
      query: capturePhotoMutation,
      variables: {
        photoCaptureRequestId: randomUUID(),
        photo: 'abc',
      },
    })

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns an unauthorized error when accessed with app roles', async () => {
    // Act
    const { errors } = await executeOperationAsApp(
      {
        query: capturePhotoMutation,
        variables: {
          photoCaptureRequestId: randomUUID(),
          photo: 'abc',
        },
      },
      ...Object.values(AppRoles),
    )

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('returns an unauthorized error when accessed with user roles', async () => {
    // Act
    const { errors } = await executeOperationAsUser(
      {
        query: capturePhotoMutation,
        variables: {
          photoCaptureRequestId: randomUUID(),
          photo: 'abc',
        },
      },
      ...Object.values(UserRoles),
    )

    // Assert
    expect(errors).toBeDefined()
    expectUnauthorizedError(errors)
  })

  it('works with valid input', async () => {
    // Arrange
    const {
      contract: { id: contractId },
      identity: { id: identityId },
    } = await setupPhotoCaptureData()
    const photoCaptureRequest = await createPhotoCaptureRequest()
    const { id: photoCaptureRequestId } = expectToBeDefined(photoCaptureRequest.data?.createPhotoCaptureRequest)

    // Act
    const { data, errors } = await executeOperationAsLimitedPhotoCaptureClient(
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

    expect(errors).toBeUndefined()
    const { capturePhoto } = expectToBeDefined(data)
    expect(capturePhoto).toBeNull()
  })

  it('prevents capturing a photo more than once', async () => {
    // Arrange
    const {
      contract: { id: contractId },
      identity: { id: identityId },
    } = await setupPhotoCaptureData()
    const photoCaptureRequest = await createPhotoCaptureRequest()
    const { id: photoCaptureRequestId } = expectToBeDefined(photoCaptureRequest.data?.createPhotoCaptureRequest)

    // Act
    const { errors } = await executeOperationAsLimitedPhotoCaptureClient(
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
        photo: validPhotoDataUrl,
        disableSession: true,
      },
    )

    // Assert
    expect(errors?.[0]?.message).toMatchInlineSnapshot(`"The photo has already been captured for this request"`)
  })

  it('prevents acquiring a token for a photo request that has already been captured', async () => {
    // Arrange
    const {
      contract: { id: contractId },
      identity: { id: identityId },
    } = await setupPhotoCaptureData()
    const photoCaptureRequest = await createPhotoCaptureRequest()
    const { id: photoCaptureRequestId } = expectToBeDefined(photoCaptureRequest.data?.createPhotoCaptureRequest)

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

    // Act
    const { errors } = await executeOperationAnonymous({
      query: acquireLimitedPhotoCaptureTokenMutation,
      variables: { input: { photoCaptureRequestId } },
    })

    // Assert
    expect(errors?.[0]?.message).toMatchInlineSnapshot(`"The photo has already been captured for this request"`)
  })

  it('returns an error for invalid photo format', async () => {
    // Arrange
    const {
      contract: { id: contractId },
      identity: { id: identityId },
    } = await setupPhotoCaptureData()
    const photoCaptureRequest = await createPhotoCaptureRequest()
    const { id: photoCaptureRequestId } = expectToBeDefined(photoCaptureRequest.data?.createPhotoCaptureRequest)

    // Act
    const { errors } = await executeOperationAsLimitedPhotoCaptureClient(
      {
        query: capturePhotoMutation,
        variables: {
          photoCaptureRequestId,
          photo: pngPhotoDataUrl,
        },
      },
      {
        contractId,
        identityId,
        photoCaptureRequestId,
      },
    )

    expect(errors?.[0]?.message).toMatchInlineSnapshot(`"Face check photo must be a valid image/jpeg data URL with base64 encoding"`)
  })

  it('returns an error for invalid photo data url', async () => {
    // Arrange
    const {
      contract: { id: contractId },
      identity: { id: identityId },
    } = await setupPhotoCaptureData()
    const photoCaptureRequest = await createPhotoCaptureRequest()
    const { id: photoCaptureRequestId } = expectToBeDefined(photoCaptureRequest.data?.createPhotoCaptureRequest)

    // Act
    const { errors } = await executeOperationAsLimitedPhotoCaptureClient(
      {
        query: capturePhotoMutation,
        variables: {
          photoCaptureRequestId,
          photo: 'hello i am a photo',
        },
      },
      {
        contractId,
        identityId,
        photoCaptureRequestId,
      },
    )

    expect(errors?.[0]?.message).toMatchInlineSnapshot(`"Face check photo must be a valid image/jpeg data URL with base64 encoding"`)
  })

  it('returns an auth error attempting to upload for a different photo request', async () => {
    // Arrange
    const {
      contract: { id: contractId },
      identity: { id: identityId },
    } = await setupPhotoCaptureData()
    const photoCaptureRequest = await createPhotoCaptureRequest()
    const photoCaptureRequest2 = await createPhotoCaptureRequest()
    const { id: photoCaptureRequestId } = expectToBeDefined(photoCaptureRequest.data?.createPhotoCaptureRequest)
    const { id: photoCaptureRequestId2 } = expectToBeDefined(photoCaptureRequest2.data?.createPhotoCaptureRequest)

    // Act
    const { errors } = await executeOperationAsLimitedPhotoCaptureClient(
      {
        query: capturePhotoMutation,
        variables: {
          photoCaptureRequestId: photoCaptureRequestId2,
          photo: pngPhotoDataUrl,
        },
      },
      {
        contractId,
        identityId,
        photoCaptureRequestId,
      },
    )

    expect(errors?.[0]?.message).toMatchInlineSnapshot(`"Not Authorized!"`)
  })
})
