import { get, intersection, isNil, merge, omit, omitBy, pick } from 'lodash'
import type {
  CreateUpdateTemplateDisplayClaimInput,
  CreateUpdateTemplateDisplayModelInput,
  TemplateDisplayModel,
  TemplateInput,
  TemplateParentData,
} from '../../generated/graphql'
import { downloadToDataUrl } from '../../util/data-url'
import { findKeysIntersection } from '../../util/intersection'
import { pruneNil } from '../../util/prune-nil'
import { convertToClaimValidation } from '../contracts/mapping'
import type { TemplateEntity } from './entities/template-entity'

/**
 * Creates a TemplateDisplayModel based on input, extracting only the properties that are defined and removing nill values
 */
function toDisplayModel(input?: CreateUpdateTemplateDisplayModelInput | null): TemplateDisplayModel | null {
  if (!input) return null

  const claims = input.claims?.map((claim) => {
    if (!claim.validation) return claim
    const validation = convertToClaimValidation(claim.validation)
    return { ...claim, validation }
  })

  return pruneNil({ ...input, claims })
}

/**
 * Creates a new object with only properties from TemplateParentData
 */
export function toTemplateParentData(
  input: Pick<TemplateParentData, 'isPublic' | 'validityIntervalInSeconds' | 'display' | 'credentialTypes'>,
): TemplateParentData {
  return omitBy(pick(input, ['isPublic', 'validityIntervalInSeconds', 'display', 'credentialTypes', 'faceCheckSupport']), isNil)
}

type Claims = CreateUpdateTemplateDisplayClaimInput[]
const CLAIMS_KEY = 'display.claims'
const TYPES_KEY = 'credentialTypes'
/**
 * Recursively finds intersecting keys between two TemplateParentData objects
 * For claims, only considers claims with values
 */
export async function findTemplateIntersectingProps(a: TemplateParentData, b: TemplateParentData): Promise<string[]> {
  const [claimsA, claimsB] = [get(a, CLAIMS_KEY, []) as Claims, get(b, CLAIMS_KEY, []) as Claims]
  const [typesA, typesB] = [get(a, TYPES_KEY, [] as string[]), get(b, TYPES_KEY, [] as string[])]
  const intersectingPropsWithoutClaims = findKeysIntersection(omit(a, CLAIMS_KEY, TYPES_KEY), omit(b, CLAIMS_KEY, TYPES_KEY), {
    ignoreNulls: true,
  })
  const logoImageA = a.display?.card?.logo?.image
  if (logoImageA && b.display?.card?.logo?.uri) {
    const logoImageB = await downloadToDataUrl(b.display.card.logo.uri, { redirect: 'error' })
    if (logoImageA !== logoImageB) {
      intersectingPropsWithoutClaims.push('display.card.logo.image')
    }
  }
  const intersectingClaimsWithValues = intersection(
    claimsA.filter((c) => !!c.value).map((c) => c.claim),
    claimsB.filter((c) => !!c.value).map((c) => c.claim),
  ).map((claim) => `display.claims[${claim}]`)
  const intersectingTypes = intersection(typesA, typesB).map((type) => `credentialTypes[${type}]`)
  return [...intersectingPropsWithoutClaims, ...intersectingClaimsWithValues, ...intersectingTypes]
}

/**
 * Throws an error if there are intersecting keys between two TemplateParentData objects
 */
export async function ensureNoIntersectingTemplateData(a: TemplateParentData, b: TemplateParentData) {
  const intersectingProps = await findTemplateIntersectingProps(a, b)
  if (intersectingProps.length > 0) {
    throw new Error(`The template overrides the following properties from its parent: ${intersectingProps.join(', ')}`)
  }
}

/**
 * Converts a TemplateDisplayModelInput to the persisted TemplateDisplayModel by omitting the card.logo.image and only keeping card.logo.uri
 */
export function toPersistedDisplayModel(
  input?: CreateUpdateTemplateDisplayModelInput | null,
  displayLogoUri?: string | null,
): TemplateEntity['display'] | null {
  const persistedModel = omit(toDisplayModel(input), 'card.logo.image')
  if (displayLogoUri) merge(persistedModel, { card: { logo: { uri: displayLogoUri } } })
  return persistedModel as TemplateEntity['display']
}
/**
 * Creates a new object with only properties from TemplateParentData
 */
export function toTemplateParentDataFromInput(
  input: TemplateInput,
): Pick<TemplateParentData, 'isPublic' | 'validityIntervalInSeconds' | 'display' | 'credentialTypes' | 'faceCheckSupport'> {
  return omitBy(
    {
      ...pick(input, ['isPublic', 'validityIntervalInSeconds', 'credentialTypes', 'faceCheckSupport']),
      display: input.display ? convertToTemplateDisplayModel(input.display) : undefined,
    },
    isNil,
  )
}

/**
 * Creates a TemplateDisplayModel based on input, resolving claim validation
 */
function convertToTemplateDisplayModel(displayInput?: CreateUpdateTemplateDisplayModelInput | null): TemplateDisplayModel | null {
  if (!displayInput) return null

  return omitBy(
    {
      ...displayInput,
      claims: displayInput.claims?.map((claim) => ({
        ...claim,
        validation: claim.validation ? convertToClaimValidation(claim.validation) : undefined,
      })),
    },
    isNil,
  )
}
