import { randomUUID } from 'crypto'
import { acquireLimitedPhotoCaptureTokenMutation } from '.'
import { beforeAfterAll, executeOperationAnonymous, expectToBeDefined } from '../../../test'
import { mockedServices } from '../../../test/mocks'
import { createPhotoCaptureRequest } from '../../photo-capture/test'

describe('acquireLimitedPhotoCaptureToken', () => {
  beforeAfterAll()
  beforeEach(() => {
    mockedServices.clearAllMocks()
    mockedServices.blobStorageContainerService.uploadDataUrl.dynamicResolveWith(
      mockedServices.blobStorageContainerService.uploadDataUrl.buildResolve,
    )
  })
  it('returns a validation error for invalid photo request ID', async () => {
    const { data, errors } = await executeOperationAnonymous({
      query: acquireLimitedPhotoCaptureTokenMutation,
      variables: { input: { photoCaptureRequestId: '123' } },
    })

    expect(data).toBeNull()
    expect(errors?.[0]?.message).toMatchInlineSnapshot(
      `"Variable "$input" got invalid value "123" at "input.photoCaptureRequestId"; Value is not a valid UUID: 123"`,
    )
  })

  it('returns an error for nonexistent photo request', async () => {
    const { data, errors } = await executeOperationAnonymous({
      query: acquireLimitedPhotoCaptureTokenMutation,
      variables: { input: { photoCaptureRequestId: randomUUID() } },
    })

    expect(data).toBeNull()
    expect(errors?.[0]?.message).toMatchInlineSnapshot(`"The specified photo capture request does not exist"`)
  })

  it('can acquire a token for a valid photo capture request', async () => {
    const photoCaptureRequest = await createPhotoCaptureRequest()
    expectToBeDefined(photoCaptureRequest.data?.createPhotoCaptureRequest)
    const { id: photoCaptureRequestId } = photoCaptureRequest.data.createPhotoCaptureRequest

    const { data, errors } = await executeOperationAnonymous({
      query: acquireLimitedPhotoCaptureTokenMutation,
      variables: { input: { photoCaptureRequestId } },
    })

    expect(errors).toBeUndefined()
    expect(data?.acquireLimitedPhotoCaptureToken.token).toBeDefined()
    expect(data?.acquireLimitedPhotoCaptureToken.expires).toBeDefined()
  })
})
