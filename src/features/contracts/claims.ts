import type {
  AsyncIssuanceRequestInput,
  ContractDisplayClaim,
  ContractDisplayModel,
  ContractDisplayModelInput,
  CreateUpdateTemplateDisplayModelInput,
  IssuanceRequestInput,
} from '../../generated/graphql'
import type { AttestationClaimMapping, DisplayClaim } from '../../services/verified-id'
import { validateClaimInput, validateClaimValue, ValidationError } from '../../util/validation'

export const displayClaimPrefix = 'vc.credentialSubject.'
export const claimTypeString = 'String'
export const claimTypeImage = 'image/jpeg;base64url'

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
  type: claimTypeImage,
}

export enum StandardClaims {
  issuanceId = 'issuanceId',
  name = 'name',
  identityId = 'identityId',
}

export const standardClaimLabels: Record<StandardClaims, string> = {
  [StandardClaims.issuanceId]: 'Credential ID',
  [StandardClaims.name]: 'Issued to',
  [StandardClaims.identityId]: 'Identity ID',
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
const validateStandardIssuanceClaims = (claims?: IssuanceRequestInput['claims'] | AsyncIssuanceRequestInput['claims']): void => {
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
  claimsInput?: IssuanceRequestInput['claims'] | AsyncIssuanceRequestInput['claims'],
  contractClaims?: ContractDisplayModel['claims'],
): void => {
  claimsInput = claimsInput ?? {}
  validateStandardIssuanceClaims(claimsInput)

  const missingRequiredClaims =
    contractClaims
      ?.filter(({ value: contractValue, isOptional }) => contractValue === undefined && !isOptional)
      .filter(({ claim: contractClaim }) => !claimsInput[contractClaim]) ?? []

  if (missingRequiredClaims.length > 0) {
    throw new ValidationError(`Claims must include: ${missingRequiredClaims.map(({ claim: contractClaim }) => contractClaim).join(', ')}`)
  }

  // Validate the provided input values for each claim
  contractClaims?.forEach(({ claim: contractClaim, type, validation, isFixed }) => {
    // Skip validation if the contract already has a fixed value
    if (isFixed) return

    const inputValue = claimsInput[contractClaim]

    if (inputValue) validateClaimValue(type, inputValue, validation as ContractDisplayClaim['validation'])
  })
}
