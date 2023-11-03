import { getClientCredentialsToken } from '@makerx/node-common'
import { setLimitedAccessData } from '..'
import config from '../../../config'
import type { CommandContext } from '../../../cqs'
import type { AccessTokenResponse, AcquireLimitedAccessTokenInput } from '../../../generated/graphql'
import { userInvariant } from '../../../util/user-invariant'

export async function AcquireLimitedAccessTokenCommand(
  this: CommandContext,
  input: AcquireLimitedAccessTokenInput,
): Promise<AccessTokenResponse> {
  userInvariant(this.user)

  const authConfig = config.get(`limitedAccessClient`)
  const token = await getClientCredentialsToken(authConfig)

  await setLimitedAccessData(token.access_token, { ...input, userId: this.user.userEntity.id })

  return {
    token: token.access_token,
    expires: token.expires,
  }
}
