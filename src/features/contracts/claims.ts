import type { ContractDisplayModelInput, CreateUpdateTemplateDisplayModelInput, IssuanceRequestInput } from '../../generated/graphql'
import type { AttestationClaimMapping, DisplayClaim } from '../../services/admin.types'

export const displayClaimPrefix = 'vc.credentialSubject.'
export const claimTypeString = 'String'

export enum StandardClaims {
  identityId = 'identityId',
  name = 'name',
}

export const standardClaimLabels: Record<StandardClaims, string> = {
  [StandardClaims.identityId]: 'Identity ID',
  [StandardClaims.name]: 'Name',
}

export const standardClaims = Object.values(StandardClaims)

export const standardClaimAttestations: AttestationClaimMapping[] = standardClaims.map((claim) => ({
  type: claimTypeString,
  required: true,
  outputClaim: claim,
  inputClaim: claim,
  indexed: claim === StandardClaims.identityId,
}))

export const standardContractDislayClaims: DisplayClaim[] = standardClaims.map((claim) => ({
  claim: `${displayClaimPrefix}${claim}`,
  label: standardClaimLabels[claim as StandardClaims],
  type: claimTypeString,
}))

const standardClaimsErrorMessage = `Claims must not include any of: ${standardClaims.join(', ')}`

/**
 * Throws an error if any of the standard claims are included.
 */
export const validateIssuanceClaims = (claims?: IssuanceRequestInput['claims']): void => {
  if (claims && Object.keys(claims).some((key) => standardClaims.includes(key as StandardClaims)))
    throw new Error(standardClaimsErrorMessage)
}

/**
 * Throws an error if any of the standard claims are included.
 */
export const validateContractClaims = (
  claims?: ContractDisplayModelInput['claims'] | CreateUpdateTemplateDisplayModelInput['claims'],
): void => {
  if (claims && claims.some(({ claim }) => standardClaims.includes(claim as StandardClaims))) throw new Error(standardClaimsErrorMessage)
}
