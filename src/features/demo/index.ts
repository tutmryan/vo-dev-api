import { getClientCredentialsToken } from '@makerx/node-common'
import { limitedAccessAuth } from '../../config'
import { AcquireLimitedAccessTokenInput } from '../../generated/graphql'
import { setLimitedAccessData } from '../limited-access-tokens'

// Routes
export const anonymousPresentationAccessTokenRoute = '/demo/presentation/token'

const allowedPresentationCredentialTypes = ['VerifiableCredential']

export async function acquireAnonymousDemoPresentationToken(request: AcquireLimitedAccessTokenInput) {
  const token = await getClientCredentialsToken(limitedAccessAuth)

  await setLimitedAccessData(token.access_token, {
    ...request,
    allowAnonymousPresentation: true,
    requestableCredentials: allowedPresentationCredentialTypes.map((type) => ({ credentialType: type })),
    userId: '',
  })

  return {
    token: token.access_token,
    expires: token.expires,
  }
}
