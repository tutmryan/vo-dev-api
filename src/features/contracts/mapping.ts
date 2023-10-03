import { get, intersection, merge, omit } from 'lodash'
import type {
  ContractDisplayClaimInput,
  ContractDisplayModelInput,
  ContractInput,
  TemplateDisplayClaim,
  TemplateParentData,
} from '../../generated/graphql'
import { findKeysOverriding } from '../../util/intersection'
import type { ContractEntity } from './entities/contract-entity'

/**
 * Recursively finds properties from ContractInput overriding its TemplateParentData counterpart
 * For claims, only considers claims with values
 */
export function findContractOverridingTemplateProps(a: ContractInput, b: TemplateParentData): string[] {
  const [claimsA, claimsB] = [
    get(a, 'display.claims', []) as ContractDisplayClaimInput[],
    get(b, 'display.claims', []) as TemplateDisplayClaim[],
  ]

  const overriddenPropsWithoutClaims = findKeysOverriding(omit(a, 'display.claims'), omit(b, 'display.claims'), { ignoreNulls: true })

  const overriddenClaims = intersection(
    claimsA.filter((c) => !!c.value).map((c) => c.claim),
    claimsB.filter((c) => !!c.value).map((c) => c.claim),
  )
    .filter((claim) => {
      const claimA = claimsA.find((x) => x.claim === claim)!
      const claimB = claimsB.find((x) => x.claim === claim)!

      return claimA.value !== claimB.value
    })
    .map((claim) => `display.claims[${claim}]`)

  return [...overriddenPropsWithoutClaims, ...overriddenClaims]
}

/**
 * Throws an error if the contract overrides the template's data
 */
export function ensureNoOverridingTemplateData(a: ContractInput, b: TemplateParentData) {
  const overriddenProps = findContractOverridingTemplateProps(a, b)
  if (overriddenProps.length > 0) {
    throw new Error(`The contract overrides the following properties from its template: ${overriddenProps.join(', ')}`)
  }
}

/**
 * Converts a ContractDisplayModelInput to the persisted ContractDisplayModel by omitting the card.logo.image and ensuring card.logo.uri is set
 */
export function toPersistedDisplayModel(input: ContractDisplayModelInput, displayLogoUrl: string): ContractEntity['display'] {
  return merge(omit(input, 'card.logo.image'), {
    card: { logo: { uri: displayLogoUrl } },
  })
}
