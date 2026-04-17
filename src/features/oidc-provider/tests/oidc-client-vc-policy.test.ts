import { VcParamMode } from '../../../generated/graphql'
import { OidcClientVcPolicy } from '../entities/oidc-client-vc-policy'

describe('OidcClientVcPolicy', () => {
  describe('default', () => {
    it('returns all fields as client_supplied', () => {
      const policy = OidcClientVcPolicy.default()

      expect(policy.vcType).toBe(VcParamMode.ClientSupplied)
      expect(policy.vcConstraintValues).toBe(VcParamMode.ClientSupplied)
    })
  })

  describe('fromInput', () => {
    it('defaults omitted fields to client_supplied', () => {
      const policy = OidcClientVcPolicy.fromInput({})

      expect(policy.vcType).toBe(VcParamMode.ClientSupplied)
      expect(policy.vcConstraintValues).toBe(VcParamMode.ClientSupplied)
    })

    it('accepts all fields explicitly', () => {
      const policy = OidcClientVcPolicy.fromInput({
        vcType: VcParamMode.Fixed,
        vcConstraintValues: VcParamMode.ClientSupplied,
      })

      expect(policy.vcType).toBe(VcParamMode.Fixed)
      expect(policy.vcConstraintValues).toBe(VcParamMode.ClientSupplied)
    })

    it('allows fixing claim name while leaving operator and values client-supplied', () => {
      const policy = OidcClientVcPolicy.fromInput({
        vcConstraintValues: VcParamMode.ClientSupplied,
      })

      expect(policy.vcConstraintValues).toBe(VcParamMode.ClientSupplied)
    })

    it('throws on invalid mode', () => {
      expect(() => OidcClientVcPolicy.fromInput({ vcType: 'invalid' as VcParamMode })).toThrow('vcType')
    })
  })

  describe('fromJSON', () => {
    it('returns default when null', () => {
      const policy = OidcClientVcPolicy.fromJSON(null)

      expect(policy.vcConstraintValues).toBe(VcParamMode.ClientSupplied)
    })

    it('deserialises from object with new constraint fields', () => {
      const policy = OidcClientVcPolicy.fromJSON({
        vcType: VcParamMode.Fixed,
        vcConstraintValues: VcParamMode.ClientSupplied,
      })

      expect(policy.vcType).toBe(VcParamMode.Fixed)
      expect(policy.vcConstraintValues).toBe(VcParamMode.ClientSupplied)
    })

    it('deserialises from JSON string', () => {
      const json = JSON.stringify({
        vcType: VcParamMode.Fixed,
        vcConstraintValues: VcParamMode.Fixed,
      })

      const policy = OidcClientVcPolicy.fromJSON(json)

      expect(policy.vcConstraintValues).toBe(VcParamMode.Fixed)
    })
  })

  describe('toJSON', () => {
    it('serialises all fields', () => {
      const policy = OidcClientVcPolicy.fromInput({
        vcType: VcParamMode.Fixed,
        vcConstraintValues: VcParamMode.Fixed,
      })

      expect(policy.toJSON()).toEqual({
        vcType: VcParamMode.Fixed,
        vcConstraintValues: VcParamMode.Fixed,
      })
    })
  })
})
