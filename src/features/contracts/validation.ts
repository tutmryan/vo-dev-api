import { lookup } from 'mime-types'
import type { ContractInput } from '../../generated/graphql'
import { isValidImageDataUrl } from '../../util/data-url'
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
  const isValid = isValidImageDataUrl(displayLogoImage, ['png', 'jpeg', 'jpg'])
  if (!isValid) throw new Error('Invalid logo image')
}

export function validateDisplayLogoUri(displayLogoUri: string) {
  const usesHttpsProtocol = ((displayLogoUri as unknown as URL).protocol || displayLogoUri).indexOf('https:') === 0
  if (!usesHttpsProtocol) throw new Error('Logo image URI requires HTTPS protocol')
  const logoMimetype = lookup(displayLogoUri)
  if (!logoMimetype) throw new Error('Could not determine logo mimetype')
  if (!['image/png', 'image/jpeg'].includes(logoMimetype)) throw new Error('Logo must be a PNG or JPEG image')
}
