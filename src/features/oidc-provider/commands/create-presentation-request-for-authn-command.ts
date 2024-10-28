import type { CommandContext } from '../../../cqs'
import type { PresentationRequestForAuthnInput, PresentationRequestResponse } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { CreatePresentationRequestCommand } from '../../presentation/commands/create-presentation-request-command'
import { buildAuthnPresentationRequest } from '../clients'
import { getInteractionId, getLoginInteractionDataForSession, getSessionKey, setLoginInteractionData } from '../session'

export async function CreatePresentationRequestForAuthnCommand(
  this: CommandContext,
  request?: PresentationRequestForAuthnInput | null,
): Promise<PresentationRequestResponse> {
  const { user } = this
  userInvariant(user)

  const authnSessionKey = getSessionKey(user.token)
  const interactionId = await getInteractionId(authnSessionKey)
  invariant(interactionId, 'Interaction session not found')
  const loginInteractionData = await getLoginInteractionDataForSession(user.token)
  invariant(loginInteractionData, 'Login session data not found')
  invariant(loginInteractionData.state === 'started', 'Login session is not in the started state')

  const presentationRequest = await buildAuthnPresentationRequest({
    clientId: loginInteractionData.clientId,
    request: request ?? undefined,
  })
  const response = await CreatePresentationRequestCommand.apply(this, [presentationRequest, { authnSessionKey }])
  if ('url' in response) await setLoginInteractionData({ ...loginInteractionData, state: 'in-progress', requestId: response.requestId })

  return response
}
