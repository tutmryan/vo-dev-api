import { lookup } from 'mime-types'
import type { ContractInput } from '../../generated/graphql'
import { invariant } from '../../util/invariant'
import { validateContractClaims } from './claims'

export const LogoImageOrUriRequiredError = 'Either display.card.logo.uri or display.card.logo.image must be provided'

export function validateContractInput(input: ContractInput) {
  validateContractClaims(input.display.claims)
  invariant(input.display.card.logo.image || input.display.card.logo.uri, LogoImageOrUriRequiredError)
}

export function validateDisplayLogo(displayLogoUri: string) {
  const logoMimetype = lookup(displayLogoUri)
  if (!logoMimetype) throw new Error('Could not determine logo mimetype')
  if (!['image/png', 'image/jpeg'].includes(logoMimetype)) throw new Error('Logo must be a PNG or JPEG image')
}
