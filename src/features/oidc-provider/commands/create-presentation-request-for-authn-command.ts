import type { CommandContext } from '../../../cqs'
import type { PresentationRequestInput, PresentationRequestResponse } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { CreatePresentationRequestCommand } from '../../presentation/commands/create-presentation-request-command'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import { getInteractionId, getLoginInteractionDataForSession, getSessionKey, setLoginInteractionData } from '../session'

export async function CreatePresentationRequestForAuthnCommand(this: CommandContext): Promise<PresentationRequestResponse> {
  const { user } = this
  userInvariant(user)

  const authnSessionKey = getSessionKey(user.token)
  const interactionId = await getInteractionId(authnSessionKey)
  invariant(interactionId, 'Interaction session not found')
  const loginInteractionData = await getLoginInteractionDataForSession(user.token)
  invariant(loginInteractionData, 'Login session data not found')
  invariant(loginInteractionData.state === 'started', 'Login session is not in the started state')
  invariant(loginInteractionData.requestedCredential, 'No requested credential found')

  const client = await this.entityManager.getRepository(OidcClientEntity).findOneByOrFail({ id: loginInteractionData.clientId })

  // validate credential types
  const requestedCredential = loginInteractionData.requestedCredential
  if (client.credentialTypes && client.credentialTypes.length > 0)
    invariant(
      client.credentialTypes.includes(requestedCredential.type),
      `Credential type ${requestedCredential.type} is not available to client: ${client.name}`,
    )

  // validate accepted issuers
  if (requestedCredential.acceptedIssuers && !client.allowAnyPartner) {
    const partners = await client.partners
    for (const issuer of requestedCredential.acceptedIssuers) {
      invariant(
        partners.some((p) => p.did === issuer),
        `Issuer ${issuer} is not allowed for client: ${client.name}`,
      )
    }
  }

  const presentationRequest: PresentationRequestInput = {
    includeQRCode: true,
    registration: {
      clientName: client.name,
    },
    requestedCredentials: [loginInteractionData.requestedCredential],
  }

  const response = await CreatePresentationRequestCommand.apply(this, [presentationRequest, { authnSessionKey }])
  if ('url' in response) await setLoginInteractionData({ ...loginInteractionData, state: 'in-progress', requestId: response.requestId })

  return response
}
