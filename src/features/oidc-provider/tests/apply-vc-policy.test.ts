import { VcParamMode } from '../../../generated/graphql'
import { applyVcPolicy } from '../apply-vc-policy'
import type { OidcClientClaimConstraint } from '../entities/oidc-client-claim-constraint'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import { OidcClientVcPolicy } from '../entities/oidc-client-vc-policy'
import { ExtraParams } from '../extra-params'

function buildMockClient(overrides: {
  credentialTypes?: string[] | null
  requireFaceCheck?: boolean
  uniqueClaimsForSubjectId?: string[] | null
  claimConstraint?: OidcClientClaimConstraint | null
  vcPolicy?: OidcClientVcPolicy
}): OidcClientEntity {
  const client = Object.create(OidcClientEntity.prototype) as OidcClientEntity
  Object.defineProperty(client, 'credentialTypes', { value: overrides.credentialTypes ?? null, writable: true })
  Object.defineProperty(client, 'requireFaceCheck', { value: overrides.requireFaceCheck ?? false, writable: true })
  Object.defineProperty(client, 'uniqueClaimsForSubjectId', {
    value: overrides.uniqueClaimsForSubjectId ?? null,
    writable: true,
  })
  Object.defineProperty(client, 'claimConstraint', { value: overrides.claimConstraint ?? null, writable: true })
  Object.defineProperty(client, 'vcPolicy', {
    value: overrides.vcPolicy ?? OidcClientVcPolicy.default(),
    writable: true,
  })
  return client
}

describe('applyVcPolicy', () => {
  describe('vc_type', () => {
    it('CLIENT_SUPPLIED: uses runtime value when provided', () => {
      const client = buildMockClient({
        credentialTypes: ['VerifiedEmployee'],
        vcPolicy: OidcClientVcPolicy.fromInput({ vcType: VcParamMode.ClientSupplied }),
      })
      const params: Record<string, unknown> = { [ExtraParams.vc_type]: 'CustomType' }

      applyVcPolicy(params, client)

      expect(params[ExtraParams.vc_type]).toBe('CustomType')
    })

    it('CLIENT_SUPPLIED: falls back to entity credentialTypes[0] when runtime value is missing', () => {
      const client = buildMockClient({
        credentialTypes: ['VerifiedEmployee'],
        vcPolicy: OidcClientVcPolicy.fromInput({ vcType: VcParamMode.ClientSupplied }),
      })
      const params: Record<string, unknown> = {}

      applyVcPolicy(params, client)

      expect(params[ExtraParams.vc_type]).toBe('VerifiedEmployee')
    })

    it('CLIENT_SUPPLIED: returns undefined when no runtime and no entity value', () => {
      const client = buildMockClient({
        credentialTypes: null,
        vcPolicy: OidcClientVcPolicy.fromInput({ vcType: VcParamMode.ClientSupplied }),
      })
      const params: Record<string, unknown> = {}

      applyVcPolicy(params, client)

      expect(params[ExtraParams.vc_type]).toBeUndefined()
    })

    it('FIXED: always uses entity value, ignoring runtime', () => {
      const client = buildMockClient({
        credentialTypes: ['VerifiedEmployee'],
        vcPolicy: OidcClientVcPolicy.fromInput({ vcType: VcParamMode.Fixed }),
      })
      const params: Record<string, unknown> = { [ExtraParams.vc_type]: 'SomethingElse' }

      applyVcPolicy(params, client)

      expect(params[ExtraParams.vc_type]).toBe('VerifiedEmployee')
    })

    it('FIXED: uses entity value when no runtime value', () => {
      const client = buildMockClient({
        credentialTypes: ['VerifiedEmployee'],
        vcPolicy: OidcClientVcPolicy.fromInput({ vcType: VcParamMode.Fixed }),
      })
      const params: Record<string, unknown> = {}

      applyVcPolicy(params, client)

      expect(params[ExtraParams.vc_type]).toBe('VerifiedEmployee')
    })
  })

  describe('vc_constraint_values', () => {
    describe('with values operator', () => {
      const valuesConstraint: OidcClientClaimConstraint = {
        claimName: 'country',
        values: ['US', 'UK'],
      }

      it('CLIENT_SUPPLIED: uses runtime constraint values when provided', () => {
        const client = buildMockClient({
          claimConstraint: valuesConstraint,
          vcPolicy: OidcClientVcPolicy.fromInput({
            vcConstraintValues: VcParamMode.ClientSupplied,
          }),
        })
        const params: Record<string, unknown> = {
          [ExtraParams.vc_constraint_value]: '18,21',
        }

        applyVcPolicy(params, client)

        expect(params[ExtraParams.vc_constraint_value]).toBe('18,21')
      })

      it('CLIENT_SUPPLIED: falls back to entity constraint value when runtime is missing', () => {
        const client = buildMockClient({
          claimConstraint: valuesConstraint,
          vcPolicy: OidcClientVcPolicy.fromInput({
            vcConstraintValues: VcParamMode.ClientSupplied,
          }),
        })
        const params: Record<string, unknown> = {}

        applyVcPolicy(params, client)

        expect(params[ExtraParams.vc_constraint_value]).toBe('US,UK')
      })

      it('FIXED: always uses entity constraint value, ignoring runtime', () => {
        const client = buildMockClient({
          claimConstraint: valuesConstraint,
          vcPolicy: OidcClientVcPolicy.fromInput({
            vcConstraintValues: VcParamMode.Fixed,
          }),
        })
        const params: Record<string, unknown> = {
          [ExtraParams.vc_constraint_value]: '18',
        }

        applyVcPolicy(params, client)

        expect(params[ExtraParams.vc_constraint_value]).toBe('US,UK')
      })
    })
  })

  describe('vc_constraint_* using values operator parameters', () => {
    const entityConstraint: OidcClientClaimConstraint = {
      claimName: 'country',
      values: ['US', 'UK'],
    }

    it('claimName + operator is always FIXED, values are CLIENT_SUPPLIED and can be overridden', () => {
      const client = buildMockClient({
        claimConstraint: entityConstraint,
        vcPolicy: OidcClientVcPolicy.fromInput({
          vcConstraintValues: VcParamMode.ClientSupplied,
        }),
      })
      const params: Record<string, unknown> = {
        [ExtraParams.vc_constraint_value]: '21',
        [ExtraParams.vc_constraint_operator]: 'cannotbeUsed',
        [ExtraParams.vc_constraint_name]: 'cannotbeUsedEither',
      }

      applyVcPolicy(params, client)

      expect(params[ExtraParams.vc_constraint_name]).toBe('country')
      expect(params[ExtraParams.vc_constraint_operator]).toBe('values')
      expect(params[ExtraParams.vc_constraint_value]).toBe('21')
    })

    it('claimName + operator is always FIXED but values are CLIENT_SUPPLIED, values defaults to config when no value is provided by client', () => {
      const client = buildMockClient({
        claimConstraint: entityConstraint,
        vcPolicy: OidcClientVcPolicy.fromInput({
          vcConstraintValues: VcParamMode.ClientSupplied,
        }),
      })
      const params: Record<string, unknown> = {
        [ExtraParams.vc_constraint_operator]: 'cannotbeUsed',
        [ExtraParams.vc_constraint_name]: 'cannotbeUsedEither',
      }

      applyVcPolicy(params, client)

      expect(params[ExtraParams.vc_constraint_name]).toBe('country')
      expect(params[ExtraParams.vc_constraint_operator]).toBe('values')
      expect(params[ExtraParams.vc_constraint_value]).toBe('US,UK')
    })

    it('claimName + operator is always FIXED, values are fixed', () => {
      const client = buildMockClient({
        claimConstraint: entityConstraint,
        vcPolicy: OidcClientVcPolicy.fromInput({
          vcConstraintValues: VcParamMode.Fixed,
        }),
      })
      const params: Record<string, unknown> = {
        [ExtraParams.vc_constraint_value]: 'EU',
      }

      applyVcPolicy(params, client)

      expect(params[ExtraParams.vc_constraint_name]).toBe('country')
      expect(params[ExtraParams.vc_constraint_operator]).toBe('values')
      expect(params[ExtraParams.vc_constraint_value]).toBe('US,UK')
    })

    describe('default policy (no policy set)', () => {
      it('should pass through all runtime values ', () => {
        const client = buildMockClient({
          credentialTypes: ['VerifiedEmployee'],
          claimConstraint: { claimName: 'country', values: ['US'] },
        })
        const params: Record<string, unknown> = {
          [ExtraParams.vc_type]: 'CustomType',
          [ExtraParams.vc_constraint_value]: '21',
        }

        applyVcPolicy(params, client)

        expect(params[ExtraParams.vc_type]).toBe('CustomType')
        expect(params[ExtraParams.vc_constraint_value]).toBe('21')
      })
    })
  })

  describe('exact + client-supplied with no entity values', () => {
    it('CLIENT_SUPPLIED: uses runtime value when entity has empty values array', () => {
      const client = buildMockClient({
        claimConstraint: { claimName: 'email', values: [] },
        vcPolicy: OidcClientVcPolicy.fromInput({
          vcConstraintValues: VcParamMode.ClientSupplied,
        }),
      })
      const params: Record<string, unknown> = {
        [ExtraParams.vc_constraint_value]: 'user@example.com',
      }

      applyVcPolicy(params, client)

      expect(params[ExtraParams.vc_constraint_name]).toBe('email')
      expect(params[ExtraParams.vc_constraint_operator]).toBe('values')
      expect(params[ExtraParams.vc_constraint_value]).toBe('user@example.com')
    })

    it('CLIENT_SUPPLIED: returns undefined value when entity has empty values and no runtime', () => {
      const client = buildMockClient({
        claimConstraint: { claimName: 'email', values: [] },
        vcPolicy: OidcClientVcPolicy.fromInput({
          vcConstraintValues: VcParamMode.ClientSupplied,
        }),
      })
      const params: Record<string, unknown> = {}

      applyVcPolicy(params, client)

      expect(params[ExtraParams.vc_constraint_name]).toBe('email')
      expect(params[ExtraParams.vc_constraint_operator]).toBe('values')
      expect(params[ExtraParams.vc_constraint_value]).toBeUndefined()
    })
  })

  describe('with no entity constraint', () => {
    it('all CLIENT_SUPPLIED: returns undefined when no runtime and no entity constraint', () => {
      const client = buildMockClient({
        claimConstraint: null,
        vcPolicy: OidcClientVcPolicy.fromInput({
          vcConstraintValues: VcParamMode.ClientSupplied,
        }),
      })
      const params: Record<string, unknown> = {}

      applyVcPolicy(params, client)

      expect(params[ExtraParams.vc_constraint_value]).toBeUndefined()
    })

    it('returns undefined when entity has no constraint', () => {
      const client = buildMockClient({
        claimConstraint: null,
        vcPolicy: OidcClientVcPolicy.fromInput({
          vcConstraintValues: VcParamMode.Fixed,
        }),
      })
      const params: Record<string, unknown> = {
        [ExtraParams.vc_constraint_name]: 'age',
        [ExtraParams.vc_constraint_operator]: 'contains',
        [ExtraParams.vc_constraint_value]: '18',
      }

      applyVcPolicy(params, client)

      expect(params[ExtraParams.vc_constraint_name]).toBeUndefined()
      expect(params[ExtraParams.vc_constraint_operator]).toBeUndefined()
      expect(params[ExtraParams.vc_constraint_value]).toBeUndefined()
    })
  })
})
