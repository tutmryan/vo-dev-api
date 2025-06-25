import type { ClaimConstraint, RequestedClaimConstraint } from '../../generated/graphql'
import { ConstraintOperator } from '../../generated/graphql'
import { safeClaimNames } from '../../util/redact-values'

export const resolveRequestedClaimConstraints = (
  claimConstraints: ClaimConstraint[] | undefined | null,
): RequestedClaimConstraint[] | null => {
  if (!claimConstraints) return null

  return claimConstraints.map((c: any) => {
    const operator: ConstraintOperator =
      'startsWith' in c
        ? ConstraintOperator.StartsWith
        : 'contains' in c
          ? ConstraintOperator.Contains
          : 'values' in c
            ? ConstraintOperator.Equals
            : ConstraintOperator.Unknown

    return {
      claimName: c.claimName,
      operator,
      values: operator === ConstraintOperator.Equals && safeClaimNames.has(c.claimName) ? c.values : null,
    }
  })
}
