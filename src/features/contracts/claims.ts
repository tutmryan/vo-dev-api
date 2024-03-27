import type { ContractDisplayModelInput, CreateUpdateTemplateDisplayModelInput, IssuanceRequestInput } from '../../generated/graphql'
import type { AttestationClaimMapping, DisplayClaim } from '../../services/verified-id'

export const displayClaimPrefix = 'vc.credentialSubject.'
export const claimTypeString = 'String'

export const faceCheckPhotoClaimAttestation: Omit<AttestationClaimMapping, 'required'> = {
  inputClaim: 'photo',
  outputClaim: 'photo',
  type: claimTypeString,
  indexed: false,
}

export const faceCheckPhotoClaimLabel = 'Photo'

export const faceCheckPhotoDisplayClaim: DisplayClaim = {
  claim: `${displayClaimPrefix}photo`,
  label: faceCheckPhotoClaimLabel,
  type: 'image/jpg;base64url',
}

export enum StandardClaims {
  issuanceId = 'issuanceId',
  name = 'name',
}

export const standardClaimLabels: Record<StandardClaims, string> = {
  [StandardClaims.issuanceId]: 'Credential ID',
  [StandardClaims.name]: 'Issued to',
}

export const standardClaims = Object.values(StandardClaims)

export const standardClaimAttestations: AttestationClaimMapping[] = standardClaims.map((claim) => ({
  type: claimTypeString,
  required: true,
  outputClaim: claim,
  inputClaim: claim,
  indexed: claim === StandardClaims.issuanceId,
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
