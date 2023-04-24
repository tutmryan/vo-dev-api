import { get, intersection, isNil, omit, omitBy, pick } from 'lodash'
import type { CreateUpdateTemplateDisplayClaimInput, TemplateDisplayModel, TemplateParentData } from '../../generated/graphql'
import { findKeysIntersection } from '../../util/intersection'
import { pruneNil } from '../../util/prune-nil'

/**
 * Creates a TemplateDisplayModel based on input, extracting only the properties that are defined and removing nill values
 */
export function toDisplayModel(input?: Omit<TemplateDisplayModel, '__typename'> | null): TemplateDisplayModel | null {
  if (!input) return null
  return pruneNil(pick(input, ['card', 'claims', 'consent', 'locale']))
}

/**
 * Creates a new object with only properties from TemplateParentData
 */
export function toTemplateParentData(
  input: Pick<TemplateParentData, 'isPublic' | 'validityIntervalInSeconds' | 'display' | 'credentialTypes'>,
): TemplateParentData {
  return omitBy(pick(input, ['isPublic', 'validityIntervalInSeconds', 'display', 'credentialTypes']), isNil)
}

type Claims = CreateUpdateTemplateDisplayClaimInput[]
const CLAIMS_KEY = 'display.claims'
const TYPES_KEY = 'credentialTypes'
/**
 * Recursively finds intersecting keys between two TemplateParentData objects
 * For claims, only considers claims with values
 */
export function findTemplateIntersectingProps(a: TemplateParentData, b: TemplateParentData): string[] {
  const [claimsA, claimsB] = [get(a, CLAIMS_KEY, []) as Claims, get(b, CLAIMS_KEY, []) as Claims]
  const [typesA, typesB] = [get(a, TYPES_KEY, [] as string[]), get(b, TYPES_KEY, [] as string[])]
  const intersectingPropsWithoutClaims = findKeysIntersection(omit(a, CLAIMS_KEY, TYPES_KEY), omit(b, CLAIMS_KEY, TYPES_KEY), {
    ignoreNulls: true,
  })
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
export function ensureNoIntersectingTemplateData(a: TemplateParentData, b: TemplateParentData) {
  const intersectingProps = findTemplateIntersectingProps(a, b)
  if (intersectingProps.length > 0) {
    throw new Error(`The template overrides the following properties from its parent: ${intersectingProps.join(', ')}`)
  }
}
