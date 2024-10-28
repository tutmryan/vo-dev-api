import { get, intersection, omit } from 'lodash'
import type { DeepPartial } from 'typeorm'
import type {
  ClaimValidation,
  ClaimValidationInput,
  ContractDisplayClaim,
  ContractDisplayClaimInput,
  ContractDisplayModelInput,
  ContractInput,
  InputMaybe,
  Maybe,
  TemplateDisplayClaim,
  TemplateParentData,
} from '../../generated/graphql'
import { downloadToDataUrl } from '../../util/data-url'
import { findKeysOverriding } from '../../util/intersection'
import type { ContractEntity } from './entities/contract-entity'

/**
 * Recursively finds properties from ContractInput overriding its TemplateParentData counterpart
 * For claims, only considers claims with values
 */
export async function findContractOverridingTemplateProps(a: ContractInput, b: TemplateParentData): Promise<string[]> {
  const [claimsA, claimsB] = [
    get(a, 'display.claims', []) as ContractDisplayClaimInput[],
    get(b, 'display.claims', []) as TemplateDisplayClaim[],
  ]

  const overriddenPropsWithoutClaims = findKeysOverriding(omit(a, 'display.claims'), omit(b, 'display.claims'), { ignoreNulls: true })

  const logoImageA = a.display.card.logo.image
  if (b.display?.card?.logo?.uri) {
    const logoImageB = await downloadToDataUrl(b.display.card.logo.uri, { redirect: 'error' })
    if (logoImageA !== logoImageB) {
      overriddenPropsWithoutClaims.push('display.card.logo.image')
    }
  }

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
export async function ensureNoOverridingTemplateData(a: ContractInput, b: TemplateParentData) {
  const overriddenProps = await findContractOverridingTemplateProps(a, b)
  if (overriddenProps.length > 0) {
    throw new Error(`The contract overrides the following properties from its template: ${overriddenProps.join(', ')}`)
  }
}

function convertToPersistedClaim(claimInput: ContractDisplayClaimInput): ContractDisplayClaim {
  return {
    ...claimInput,
    validation: convertToClaimValidation(claimInput.validation),
  }
}

/**
 * Converts a ContractDisplayModelInput to the persisted ContractDisplayModel by omitting the card.logo.image and ensuring card.logo.uri is set
 */
export function toPersistedDisplayModel(input: ContractDisplayModelInput, displayLogoUrl: string): ContractEntity['display'] {
  const { card, claims, ...rest } = input

  return {
    ...rest,
    card: {
      ...card,
      logo: {
        ...omit(card.logo, 'image'),
        uri: displayLogoUrl,
      },
    },
    claims: claims.map(convertToPersistedClaim),
  }
}

export function convertToClaimValidation(validationInput?: InputMaybe<ClaimValidationInput>): Maybe<ClaimValidation> | undefined {
  if (!validationInput) return undefined
  const { string, int, float, list, regex } = validationInput
  return string ?? int ?? float ?? list ?? regex
}

export function convertToClaimValidationInput(
  validation?: InputMaybe<DeepPartial<ClaimValidationInput>> | undefined,
): InputMaybe<ClaimValidationInput> | undefined {
  if (!validation) return undefined
  const { string, int, float, list, regex } = validation
  if (string) return { string }
  if (int) return { int }
  if (float) return { float }
  if (list?.values) return { list: { values: list.values } }
  if (regex?.pattern) return { regex: { pattern: regex.pattern } }
  return undefined
}
