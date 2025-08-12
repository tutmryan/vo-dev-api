import type { ClaimsParameter, ClaimsParameterMember, Client, KoaContextWithOIDC } from 'oidc-provider'
import { invariant } from '../../util/invariant'
import { supportedAcrs } from './claims'

export function assertClaimsParameter(_ctx: KoaContextWithOIDC, claims: ClaimsParameter, _client: Client) {
  if (claims.id_token) {
    const { id_token } = claims

    // OIDC 5.5.1.1
    // If the acr Claim is requested as an Essential Claim for the ID Token with a value or values parameter requesting specific Authentication
    // Context Class Reference values and the implementation supports the claims parameter, the Authorization Server MUST return an acr Claim
    // Value that matches one of the requested values. The Authorization Server MAY ask the End-User to re-authenticate with additional factors
    // to meet this requirement. If this is an Essential Claim and the requirement cannot be met, then the Authorization Server MUST treat that
    // outcome as a failed authentication attempt.
    if (id_token.acr?.essential) {
      if (id_token.acr.values || id_token.acr.value) {
        const requestedAcrs = id_token.acr.values || [id_token.acr.value!]
        const supportedAcrsSet = new Set<string>(supportedAcrs)
        // intersect requestedAcrs with supportedAcrs to ensure one or more supported acrs are present
        const validAcrs = requestedAcrs.filter((acr) => supportedAcrsSet.has(acr))
        invariant(validAcrs.length > 0, `No valid acr claims found in requested acrs: ${requestedAcrs.join(', ')}`)
      }
    }
  }
}

export function simplifyClaimParameter(member?: ClaimsParameterMember) {
  if (!member) return undefined

  return {
    essential: member.essential ?? false,
    values: [member.value, ...(member.values || [])].filter((v) => !!v),
  }
}

export function filterToRequestedClaimsAmr(amr: string[], requestedClaims: ClaimsParameter) {
  const filteredAmr: string[] = []

  if (requestedClaims.id_token?.amr) {
    const amrClaim = simplifyClaimParameter(requestedClaims.id_token.amr)
    if (amrClaim) {
      filteredAmr.push(...amr.filter((a) => amrClaim.values.includes(a)))
      // Spec: Requests that the Claim be returned with one of a set of values, with the val  ues appearing in order of preference
      // Note: it likely doesn't matter for the AMR claim, but it's not hard either to honour the order requested
      filteredAmr.sort((a, b) => {
        const aIndex = amrClaim.values.indexOf(a)
        const bIndex = amrClaim.values.indexOf(b)
        return aIndex - bIndex
      })
    }
  }

  // If no specific AMR claim shape is requested, return the original AMR
  return filteredAmr.length > 0 ? filteredAmr : amr
}

/**
 * @note The `claimsParameter` has been pre-validated by `assertClaimsParameter` to ensure at least one valid claim value is present when
 * flagged as essential
 */
export function filterToRequestedClaimsAcr(acr: string, requestedClaims: ClaimsParameter): string {
  if (requestedClaims.id_token?.acr) {
    const acrClaim = simplifyClaimParameter(requestedClaims.id_token.acr)
    if (acrClaim && acrClaim.values.length > 0) {
      const validAcrs: string[] = [...supportedAcrs]
      const validRequestedAcrs = acrClaim.values.filter((a) => validAcrs.includes(a ?? ''))
      if (validAcrs.length > 0) {
        // Return the first preference (spec: Requests that the Claim be returned with one of a set of values, with the values appearing in order of preference)
        return validRequestedAcrs[0]!
      }
    }
  }
  // If no specific ACR claim is requested or cannot be satisfied, return the original ACR
  return acr
}
