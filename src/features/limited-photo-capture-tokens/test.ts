import { randomUUID } from 'crypto'
import { graphql } from '../../generated'
import { beforeAfterAll, executeOperationAnonymous, expectToBeDefined } from '../../test'
import { createPhotoCaptureRequest } from '../photo-capture/test'

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

const acquireLimitedPhotoCaptureTokenMutation = graphql(`
  mutation AcquireLimitedPhotoCaptureToken($input: AcquireLimitedPhotoCaptureTokenInput!) {
    acquireLimitedPhotoCaptureToken(input: $input) {
      token
      expires
    }
  }
`)

describe('acquireLimitedPhotoCaptureToken', () => {
  beforeAfterAll()

  it('returns a validation error for invalid photo request ID', async () => {
    const { data, errors } = await executeOperationAnonymous({
      query: acquireLimitedPhotoCaptureTokenMutation,
      variables: { input: { photoCaptureRequestId: '123' } },
    })

    expect(data).toBeUndefined()
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
    const { id: photoCaptureRequestId } = expectToBeDefined(photoCaptureRequest.data?.createPhotoCaptureRequest)

    const { data, errors } = await executeOperationAnonymous({
      query: acquireLimitedPhotoCaptureTokenMutation,
      variables: { input: { photoCaptureRequestId } },
    })

    expect(errors).toBeUndefined()
    expect(data?.acquireLimitedPhotoCaptureToken.token).toBeDefined()
    expect(data?.acquireLimitedPhotoCaptureToken.expires).toBeDefined()
  })
})
