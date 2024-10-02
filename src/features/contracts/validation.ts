import type { ContractInput, TemplateInput } from '../../generated/graphql'
import { parseDataUrl } from '../../util/data-url'
import { validateContractClaims } from './claims'

const notSupportedCredentialTypes = ['VerifiedEmployee']

export function validateContractInput(input: ContractInput) {
  validateContractClaims(input.display.claims)
  validateDisplayLogoImage(input.display.card.logo.image)
  validateContractCredentialTypes(input.credentialTypes)
}

export function validateTemplateInput(input: TemplateInput) {
  validateContractClaims(input.display?.claims)
  if (input.credentialTypes) validateContractCredentialTypes(input?.credentialTypes)
  if (input.display?.card?.logo?.image) validateDisplayLogoImage(input.display.card.logo.image)
}

function validateDisplayLogoImage(displayLogoImage: string) {
  try {
    parseDataUrl(displayLogoImage, { validMimeTypes: ['image/png', 'image/jpeg'], validEncodings: ['base64'] })
  } catch (error) {
    throw new Error('Logo image must be a valid image/png or image/jpeg data URL with base64 encoding')
  }
}

export function validateContractCredentialTypes(credentialTypes: ContractInput['credentialTypes']) {
  if (!credentialTypes) return

  const notSupportedCredentialIndex = credentialTypes.findIndex((type) => notSupportedCredentialTypes.includes(type))
  if (notSupportedCredentialIndex !== -1) {
    throw new Error(`${credentialTypes[notSupportedCredentialIndex]} is not a supported credential type`)
  }
}
