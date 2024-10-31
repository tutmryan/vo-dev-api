import type {
  AsyncIssuanceRequestInput,
  ContractDisplayModel,
  ContractDisplayModelInput,
  CreateUpdateTemplateDisplayModelInput,
  IssuanceRequestInput,
} from '../../generated/graphql'
import type { AttestationClaimMapping, DisplayClaim } from '../../services/verified-id'
import { validateClaimInput } from '../../util/validation-with-zod'

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
  type: 'image/jpeg;base64url',
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
export const validateIssuanceClaims = (claims?: IssuanceRequestInput['claims'] | AsyncIssuanceRequestInput['claims']): void => {
  if (claims && Object.keys(claims).some((key) => standardClaims.includes(key as StandardClaims)))
    throw new Error(standardClaimsErrorMessage)
}

/**
 * Validates all contract claims inputs, throwing an error if any standard claims are included
 * or if any claim fails individual validation.
 */
export const validateContractClaims = (
  claimsInputs?: ContractDisplayModelInput['claims'] | CreateUpdateTemplateDisplayModelInput['claims'],
): void => {
  claimsInputs?.forEach((claimInput) => {
    if (standardClaims.includes(claimInput.claim as StandardClaims)) {
      throw new Error(standardClaimsErrorMessage)
    }
    validateClaimInput(claimInput)
  })
}

/**
 * Validates the supplied claims can be used to issue a valid contract.
 * Note: This function is only intended to be used for upfront validation of async issuance requests, since actual issuances are validated according to the published contract by the Microsoft VID service.
 */
export const validateIssuanceClaimsAgainstContractClaims = (
  claims?: IssuanceRequestInput['claims'] | AsyncIssuanceRequestInput['claims'],
  contractClaims?: ContractDisplayModel['claims'] | CreateUpdateTemplateDisplayModelInput['claims'],
): void => {
  claims = claims ?? {}
  const requiredClaims = contractClaims?.filter(({ value }) => value === undefined)
  const missingRequiredClaims = requiredClaims?.filter(({ claim }) => !claims[claim]) ?? []
  if (missingRequiredClaims.length > 0)
    throw new Error(`Claims must include: ${missingRequiredClaims.map(({ claim }) => claim).join(', ')}`)
}
