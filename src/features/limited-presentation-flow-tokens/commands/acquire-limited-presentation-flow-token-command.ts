import { getClientCredentialsToken } from '@makerx/node-common'
import { setLimitedPresentationFlowTokenData } from '..'
import { limitedPresentationFlowAuth } from '../../../config'
import type { CommandContext } from '../../../cqs'
import type { AcquireLimitedPresentationFlowTokenInput, PresentationFlowTokenResponse } from '../../../generated/graphql'
import { PresentationFlowStatus } from '../../../generated/graphql'
import { PresentationFlowEntity } from '../../presentation-flow/entities/presentation-flow-entity'

export async function AcquireLimitedPresentationFlowTokenCommand(
  this: CommandContext,
  input: AcquireLimitedPresentationFlowTokenInput,
): Promise<PresentationFlowTokenResponse> {
  const { entityManager } = this

  const request = await entityManager.getRepository(PresentationFlowEntity).findOneByOrFail({ id: input.presentationFlowId })

  const blockedStatuses: PresentationFlowStatus[] = [
    PresentationFlowStatus.Submitted,
    PresentationFlowStatus.Cancelled,
    PresentationFlowStatus.Expired,
  ]
  if (blockedStatuses.includes(request.status)) {
    throw new Error(`Presentation flow is ${request.status.toLowerCase()} and can no longer be accessed`)
  }

  const userId = request.createdById

  const token = await getClientCredentialsToken(limitedPresentationFlowAuth)

  await setLimitedPresentationFlowTokenData(token.access_token, {
    ...input,
    userId,
    presentationId: request.presentationId ?? undefined,
  })

  return {
    token: token.access_token,
    expires: token.expires,
  }
}
