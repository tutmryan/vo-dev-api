import type { OidcClientClaimConstraint } from '../entities/oidc-client-claim-constraint'
import {
  claimConstraintFromJSON,
  constraintToExtraParams,
  getConstraintOperator,
  validateClaimConstraint,
} from '../entities/oidc-client-claim-constraint'

describe('OidcClientClaimConstraint', () => {
  describe('getConstraintOperator', () => {
    it('should return "values" when values array is set', () => {
      expect(getConstraintOperator({ claimName: 'country', values: ['US'] })).toBe('values')
    })

    it('should return "contains" when contains is set', () => {
      expect(getConstraintOperator({ claimName: 'email', contains: '@example.com' })).toBe('contains')
    })

    it('should return "startsWith" when startsWith is set', () => {
      expect(getConstraintOperator({ claimName: 'name', startsWith: 'John' })).toBe('startsWith')
    })

    it('should return undefined when no operator is set', () => {
      expect(getConstraintOperator({ claimName: 'country' })).toBeUndefined()
    })

    it('should return undefined when multiple operators are set', () => {
      expect(getConstraintOperator({ claimName: 'country', values: ['US'], contains: 'US' })).toBeUndefined()
    })

    it('should not count an empty values array as an active operator', () => {
      expect(getConstraintOperator({ claimName: 'country', values: [] })).toBeUndefined()
    })
  })

  describe('validateClaimConstraint', () => {
    it('should accept a valid constraint with values operator', () => {
      expect(() => validateClaimConstraint({ claimName: 'country', values: ['US', 'UK'] })).not.toThrow()
    })

    it('should accept a valid constraint with contains operator', () => {
      expect(() => validateClaimConstraint({ claimName: 'email', contains: '@example.com' })).not.toThrow()
    })

    it('should accept a valid constraint with startsWith operator', () => {
      expect(() => validateClaimConstraint({ claimName: 'name', startsWith: 'John' })).not.toThrow()
    })

    it('should accept values with a single element', () => {
      expect(() => validateClaimConstraint({ claimName: 'country', values: ['US'] })).not.toThrow()
    })

    it('should reject a constraint with empty claimName', () => {
      expect(() => validateClaimConstraint({ claimName: '', values: ['US'] })).toThrow('non-empty claimName')
    })

    it('should reject a constraint with whitespace-only claimName', () => {
      expect(() => validateClaimConstraint({ claimName: '   ', values: ['US'] })).toThrow('non-empty claimName')
    })

    it('should reject a constraint with no operator set', () => {
      expect(() => validateClaimConstraint({ claimName: 'country' })).toThrow('exactly one operator')
    })

    it('should reject a constraint with multiple operators set', () => {
      expect(() => validateClaimConstraint({ claimName: 'country', values: ['US'], contains: 'US' })).toThrow('exactly one operator')
    })

    it('should reject an empty values array', () => {
      expect(() => validateClaimConstraint({ claimName: 'country', values: [] })).toThrow('exactly one operator')
    })
  })

  describe('claimConstraintFromJSON', () => {
    it('should return null for null input', () => {
      expect(claimConstraintFromJSON(null)).toBeNull()
    })

    it('should return null for empty string', () => {
      expect(claimConstraintFromJSON('')).toBeNull()
    })

    it('should deserialise from a JSON string with values operator', () => {
      const json = JSON.stringify({ claimName: 'country', values: ['US', 'UK'] })
      const result = claimConstraintFromJSON(json)

      expect(result).toEqual({ claimName: 'country', values: ['US', 'UK'] })
    })

    it('should deserialise from a JSON string with contains operator', () => {
      const json = JSON.stringify({ claimName: 'email', contains: '@example.com' })
      const result = claimConstraintFromJSON(json)

      expect(result).toEqual({ claimName: 'email', contains: '@example.com' })
    })

    it('should deserialise from a JSON string with startsWith operator', () => {
      const json = JSON.stringify({ claimName: 'name', startsWith: 'John' })
      const result = claimConstraintFromJSON(json)

      expect(result).toEqual({ claimName: 'name', startsWith: 'John' })
    })

    it('should pass through an object directly', () => {
      const obj: OidcClientClaimConstraint = { claimName: 'email', contains: '@example.com' }
      expect(claimConstraintFromJSON(obj)).toBe(obj)
    })

    it('should round-trip through JSON.stringify and fromJSON', () => {
      const original: OidcClientClaimConstraint = { claimName: 'country', values: ['US', 'UK', 'AU'] }
      const json = JSON.stringify(original)
      const restored = claimConstraintFromJSON(json)

      expect(restored).toEqual(original)
    })
  })

  describe('constraintToExtraParams', () => {
    it('should return all undefined for null constraint', () => {
      expect(constraintToExtraParams(null)).toEqual({
        name: undefined,
        operator: undefined,
        value: undefined,
      })
    })

    it('should project values operator with comma-separated value', () => {
      const result = constraintToExtraParams({ claimName: 'country', values: ['US', 'UK', 'AU'] })

      expect(result).toEqual({
        name: 'country',
        operator: 'values',
        value: 'US,UK,AU',
      })
    })

    it('should project values operator with single value', () => {
      const result = constraintToExtraParams({ claimName: 'country', values: ['US'] })

      expect(result).toEqual({
        name: 'country',
        operator: 'values',
        value: 'US',
      })
    })

    it('should project contains operator with single value', () => {
      const result = constraintToExtraParams({ claimName: 'email', contains: '@example.com' })

      expect(result).toEqual({
        name: 'email',
        operator: 'contains',
        value: '@example.com',
      })
    })

    it('should project startsWith operator with single value', () => {
      const result = constraintToExtraParams({ claimName: 'name', startsWith: 'John' })

      expect(result).toEqual({
        name: 'name',
        operator: 'startsWith',
        value: 'John',
      })
    })

    it('should return all undefined for constraint with no valid operator', () => {
      const result = constraintToExtraParams({ claimName: 'country' })

      expect(result).toEqual({
        name: undefined,
        operator: undefined,
        value: undefined,
      })
    })
  })
})
