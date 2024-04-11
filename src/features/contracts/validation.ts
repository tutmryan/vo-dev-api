import { lookup } from 'mime-types'
import type { ContractInput } from '../../generated/graphql'
import { parseDataUrl } from '../../util/data-url'
import { invariant } from '../../util/invariant'
import { validateContractClaims } from './claims'

export const LogoImageOrUriRequiredError = 'Either display.card.logo.uri or display.card.logo.image must be provided'

export function validateContractInput(input: ContractInput) {
  validateContractClaims(input.display.claims)
  invariant(input.display.card.logo.image || input.display.card.logo.uri, LogoImageOrUriRequiredError)
  if (input.display.card.logo.image) {
    validateDisplayLogoImage(input.display.card.logo.image)
  }
}

export function validateDisplayLogoImage(displayLogoImage: string) {
  try {
    parseDataUrl(displayLogoImage, { validMimeTypes: ['image/png', 'image/jpeg'], validEncodings: ['base64'] })
  } catch (error) {
    throw new Error('Logo image must be a valid image/png or image/jpeg data URL with base64 encoding')
  }
}

export function validateDisplayLogoUri(displayLogoUri: string) {
  const usesHttpsProtocol = ((displayLogoUri as unknown as URL).protocol || displayLogoUri).indexOf('https:') === 0
  if (!usesHttpsProtocol) throw new Error('Logo image URI requires HTTPS protocol')
  const logoMimetype = lookup(displayLogoUri)
  if (!logoMimetype) throw new Error('Could not determine logo mimetype')
  if (!['image/png', 'image/jpeg'].includes(logoMimetype)) throw new Error('Logo must be a PNG or JPEG image')
}
