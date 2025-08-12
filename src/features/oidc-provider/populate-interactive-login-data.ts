import { invariant } from '../../util/invariant'
import type { ApplyPostIntercept } from './integration-hook'
import { getLoginInteractionData, setLoginInteractionData } from './session'

export const applyPopulateInteractiveLoginDataHook: ApplyPostIntercept = async (ctx) => {
  const { oidc } = ctx

  invariant(oidc.entities.Interaction, 'oidc.entities.Interaction was not found')
  const interactionData = await getLoginInteractionData(oidc.entities.Interaction.uid)

  if ((oidc.claims.id_token || oidc.claims.userinfo) && !interactionData?.requestedClaims) {
    await setLoginInteractionData({
      interactionId: oidc.entities.Interaction.uid,
      state: 'pre-start',
      requestedClaims: oidc.claims,
      ...interactionData, // Allow state to be overridden, as we only want to set claimsParameter
    })
  }
}
