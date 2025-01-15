import { getClientCredentialsToken } from '@makerx/node-common'
import { setLimitedAccessData } from '..'
import { limitedAccessAuth } from '../../../config'
import type { CommandContext } from '../../../cqs'
import type { AccessTokenResponse, AcquireLimitedAccessTokenInput } from '../../../generated/graphql'
import { userInvariant } from '../../../util/user-invariant'

export async function AcquireLimitedAccessTokenCommand(
  this: CommandContext,
  input: AcquireLimitedAccessTokenInput,
): Promise<AccessTokenResponse> {
  userInvariant(this.user)

  const token = await getClientCredentialsToken(limitedAccessAuth)

  await setLimitedAccessData(token.access_token, { ...input, userId: this.user.entity.id })

  return {
    token: token.access_token,
    expires: token.expires,
  }
}
