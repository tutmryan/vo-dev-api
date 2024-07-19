import { randomUUID } from 'crypto'
import { graphql } from '../../../generated'

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

export const acquireLimitedPhotoCaptureTokenMutation = graphql(`
  mutation AcquireLimitedPhotoCaptureToken($input: AcquireLimitedPhotoCaptureTokenInput!) {
    acquireLimitedPhotoCaptureToken(input: $input) {
      token
      expires
    }
  }
`)
