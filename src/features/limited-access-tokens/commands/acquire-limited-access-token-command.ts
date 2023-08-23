import { getClientCredentialsToken } from '@makerx/node-common'
import { setLimitedAccessData } from '..'
import config from '../../../config'
import type { CommandContext } from '../../../cqrs/command-context'
import type { AccessTokenResponse, AcquireLimitedAccessTokenInput } from '../../../generated/graphql'

export async function AcquireLimitedAccessTokenCommand(
  this: CommandContext,
  input: AcquireLimitedAccessTokenInput,
): Promise<AccessTokenResponse> {
  const authConfig = config.get(`limitedAccessClient`)
  const token = await getClientCredentialsToken(authConfig)
  await setLimitedAccessData(token.access_token, input)
  return {
    token: token.access_token,
    expires: token.expires,
  }
}
