import { ConstraintOperator } from '../../generated/graphql'
import { PresentationEntity } from './entities/presentation-entity'
import { resolveRequestedClaimConstraints } from './requested-claim-constraint-resolver'

describe('resolveRequestedClaimConstraints', () => {
  it.each([
    {
      name: 'equals operator for identityId with values',
      constraint: { claimName: 'identityId', values: ['abc'] },
      expected: {
        claimName: 'identityId',
        operator: ConstraintOperator.Equals,
        values: ['abc'],
      },
    },
    {
      name: 'equals operator for issuanceId with values',
      constraint: { claimName: 'issuanceId', values: ['abc', 'def'] },
      expected: {
        claimName: 'issuanceId',
        operator: ConstraintOperator.Equals,
        values: ['abc', 'def'],
      },
    },
    {
      name: 'equals operator with redacted values',
      constraint: { claimName: 'name', values: ['bob'] },
      expected: {
        claimName: 'name',
        operator: ConstraintOperator.Equals,
        values: null,
      },
    },
    {
      name: 'startsWith operator with redacted value',
      constraint: { claimName: 'some_field', startsWith: 'abc' },
      expected: {
        claimName: 'some_field',
        operator: ConstraintOperator.StartsWith,
        values: null,
      },
    },
    {
      name: 'contains operator with redacted value',
      constraint: { claimName: 'some_field', contains: 'abc' },
      expected: {
        claimName: 'some_field',
        operator: ConstraintOperator.Contains,
        values: null,
      },
    },
    {
      name: 'unknown operator when no known keys are present',
      constraint: { claimName: 'weird_field' },
      expected: {
        claimName: 'weird_field',
        operator: ConstraintOperator.Unknown,
        values: null,
      },
    },
  ])('resolves $name', ({ constraint, expected }) => {
    const entity = givenAPresentationEntityWithConstraints([constraint])
    const credential = entity.requestedCredentials[0]

    const resolvedConstraints = resolveRequestedClaimConstraints(credential?.constraints)

    expect(resolvedConstraints).toEqual([expected])
  })
})

const givenAPresentationEntityWithConstraints = (constraints: unknown[]): PresentationEntity => {
  const entity = new PresentationEntity()
  entity.requestedCredentialsJson = JSON.stringify([
    {
      type: 'SomeCredential',
      constraints,
    },
  ])
  return entity
}
