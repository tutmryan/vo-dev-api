import type { OidcClientVcPolicyInput } from '../../../generated/graphql'
import { VcParamMode } from '../../../generated/graphql'

const allowedModes: VcParamMode[] = [VcParamMode.ClientSupplied, VcParamMode.Fixed]

export interface OidcClientVcPolicyData {
  vcType: VcParamMode
  vcConstraintValues: VcParamMode
}

export class OidcClientVcPolicy {
  readonly vcType: VcParamMode
  readonly vcConstraintValues: VcParamMode

  private constructor(data: OidcClientVcPolicyData) {
    this.vcType = data.vcType
    this.vcConstraintValues = data.vcConstraintValues
  }

  static default(): OidcClientVcPolicy {
    return new OidcClientVcPolicy({
      vcType: VcParamMode.ClientSupplied,
      vcConstraintValues: VcParamMode.ClientSupplied,
    })
  }

  /**
   * Creates a policy from the GraphQL input type.
   * Omitted fields default to client_supplied.
   */
  static fromInput(input: OidcClientVcPolicyInput): OidcClientVcPolicy {
    const vcType = input.vcType ?? VcParamMode.ClientSupplied
    const vcConstraintValues = input.vcConstraintValues ?? VcParamMode.ClientSupplied
    validateMode('vcType', vcType)
    validateMode('vcConstraintValues', vcConstraintValues)

    return new OidcClientVcPolicy({
      vcType,
      vcConstraintValues,
    })
  }

  /**
   * Deserialise from a JSON column value (string or object) or null.
   * Returns default policy when null/empty.
   *
   * Handles legacy data where fields may be missing or obsolete keys
   * may be present by falling back to defaults for any missing field.
   */
  static fromJSON(json: string | Record<string, unknown> | null | undefined): OidcClientVcPolicy {
    const defaults = OidcClientVcPolicy.default()
    if (!json) return defaults

    const data: Record<string, unknown> = typeof json === 'string' ? (JSON.parse(json) as Record<string, unknown>) : json

    const vcType = data.vcType as VcParamMode | undefined
    const vcConstraintValues = data.vcConstraintValues as VcParamMode | undefined

    return new OidcClientVcPolicy({
      vcType: vcType ?? defaults.vcType,
      vcConstraintValues: vcConstraintValues ?? defaults.vcConstraintValues,
    })
  }

  toJSON(): OidcClientVcPolicyData {
    return {
      vcType: this.vcType,
      vcConstraintValues: this.vcConstraintValues,
    }
  }
}

function validateMode(field: string, mode: VcParamMode): void {
  if (!allowedModes.includes(mode)) {
    throw new Error(`${field}: mode must be one of ${allowedModes.join(', ')}, got: ${mode}`)
  }
}
