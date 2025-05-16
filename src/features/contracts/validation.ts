import type { ContractInput, TemplateInput } from '../../generated/graphql'
import { parseDataUrl } from '../../util/data-url'
import type { TemplateEntity } from '../templates/entities/template-entity'
import { validateContractClaims } from './claims'

export const notSupportedCredentialTypes = ['VerifiedEmployee']
export const maxTemplateDepth = 4

export function validateContractInput(input: ContractInput) {
  validateContractClaims(input.display.claims)
  validateDisplayLogoImage(input.display.card.logo.image)
  validateContractCredentialTypes(input.credentialTypes)
}

export function validateTemplateInput(input: TemplateInput) {
  validateContractClaims(input.display?.claims)
  if (input.display?.card?.logo?.image) validateDisplayLogoImage(input.display.card.logo.image)
  if (input.credentialTypes) validateContractCredentialTypes(input.credentialTypes)
}

function validateDisplayLogoImage(displayLogoImage: string) {
  try {
    parseDataUrl(displayLogoImage, { validMimeTypes: ['image/png', 'image/jpeg'], validEncodings: ['base64'] })
  } catch (error) {
    throw new Error('Logo image must be a valid image/png or image/jpeg data URL with base64 encoding')
  }
}

export function validateContractCredentialTypes(credentialTypes: ContractInput['credentialTypes']) {
  const notSupportedCredentialIndex = credentialTypes.findIndex((type) => notSupportedCredentialTypes.includes(type))
  if (notSupportedCredentialIndex !== -1) {
    throw new Error(`${credentialTypes[notSupportedCredentialIndex]} is not a supported credential type`)
  }
}

export async function validateTemplateDepth(parent: TemplateEntity) {
  const seen = new Set<string>()
  let depth = 0
  let current: TemplateEntity | null = parent

  while (current) {
    if (seen.has(current.id)) {
      throw new Error('Circular template reference detected')
    }
    seen.add(current.id)

    depth++
    if (depth >= maxTemplateDepth) {
      throw new Error(`Template is too deep (level ${depth}). The maximum allowed template depth is ${maxTemplateDepth - 1}.`)
    }

    current = await current.parent
  }
}
