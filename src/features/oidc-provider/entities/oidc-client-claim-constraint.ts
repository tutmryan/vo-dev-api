/**
 * Represents a single claim constraint stored on the OIDC client entity.
 *
 * Uses the same shape as the GraphQL `ClaimConstraint` input type:
 * - For `values` operator:    { claimName, values: ["US", "UK"] }
 * - For `contains` operator:  { claimName, contains: "@example.com" }
 * - For `startsWith` operator: { claimName, startsWith: "John" }
 *
 * Exactly one operator field must be set.
 *
 * Dynamic constraint values (e.g. `{oidc:login_hint}`) are NOT stored here.
 * Those are a runtime/client-supplied concern resolved by the session layer.
 */
export interface OidcClientClaimConstraint {
  claimName: string
  values?: string[]
  contains?: string
  startsWith?: string
}

type Operator = 'values' | 'contains' | 'startsWith'

/**
 * Returns the active operator for the constraint, or undefined if none/invalid.
 */
export function getConstraintOperator(constraint: OidcClientClaimConstraint): Operator | undefined {
  const ops: Operator[] = []
  if (constraint.values && constraint.values.length > 0) ops.push('values')
  if (constraint.contains !== undefined) ops.push('contains')
  if (constraint.startsWith !== undefined) ops.push('startsWith')
  return ops.length === 1 ? ops[0] : undefined
}

/**
 * Validates that a claim constraint has the required shape.
 * Exactly one operator (values, contains, startsWith) must be set.
 */
export function validateClaimConstraint(constraint: OidcClientClaimConstraint): void {
  if (!constraint.claimName || constraint.claimName.trim().length === 0) {
    throw new Error('Claim constraint must have a non-empty claimName')
  }

  const operator = getConstraintOperator(constraint)
  if (!operator) {
    throw new Error('Claim constraint must have exactly one operator: values, contains, or startsWith')
  }

  if (operator === 'values' && constraint.values!.length === 0) {
    throw new Error('Claim constraint with values operator must have at least one value')
  }
}

/**
 * Deserialise from the JSON column value.
 */
export function claimConstraintFromJSON(json: string | OidcClientClaimConstraint | null): OidcClientClaimConstraint | null {
  if (!json) return null
  return typeof json === 'string' ? (JSON.parse(json) as OidcClientClaimConstraint) : json
}

/**
 * Projects the stored constraint into the flat vc_constraint_* extra param values.
 *
 * Returns undefined for all three params if the constraint is null.
 */
export function constraintToExtraParams(constraint: OidcClientClaimConstraint | null): {
  name: string | undefined
  operator: string | undefined
  value: string | undefined
} {
  if (!constraint) {
    return { name: undefined, operator: undefined, value: undefined }
  }

  const op = getConstraintOperator(constraint)

  switch (op) {
    case 'values':
      return {
        name: constraint.claimName,
        operator: 'values',
        value: constraint.values!.join(','),
      }
    case 'contains':
      return {
        name: constraint.claimName,
        operator: 'contains',
        value: constraint.contains!,
      }
    case 'startsWith':
      return {
        name: constraint.claimName,
        operator: 'startsWith',
        value: constraint.startsWith!,
      }
    default:
      return { name: undefined, operator: undefined, value: undefined }
  }
}
