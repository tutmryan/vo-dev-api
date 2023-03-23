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
  input: Pick<TemplateParentData, 'isPublic' | 'validityIntervalInSeconds' | 'display'>,
): TemplateParentData {
  return omitBy(pick(input, ['isPublic', 'validityIntervalInSeconds', 'display']), isNil)
}

type Claims = CreateUpdateTemplateDisplayClaimInput[]
/**
 * Recursively finds intersecting keys between two TemplateParentData objects
 * For claims, only considers claims with values
 */
export function findTemplateIntersectingProps(a: TemplateParentData, b: TemplateParentData): string[] {
  const [claimsA, claimsB] = [get(a, 'display.claims', []) as Claims, get(b, 'display.claims', []) as Claims]
  const intersectingPropsWithoutClaims = findKeysIntersection(omit(a, 'display.claims'), omit(b, 'display.claims'), { ignoreNulls: true })
  const intersectingClaimsWithValues = intersection(
    claimsA.filter((c) => !!c.value).map((c) => c.claim),
    claimsB.filter((c) => !!c.value).map((c) => c.claim),
  ).map((claim) => `display.claims[${claim}]`)
  return [...intersectingPropsWithoutClaims, ...intersectingClaimsWithValues]
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
