import { VcParamMode } from '../../generated/graphql'
import { constraintToExtraParams } from './entities/oidc-client-claim-constraint'
import type { OidcClientEntity } from './entities/oidc-client-entity'
import { ExtraParams } from './extra-params'

/**
 * Applies the OIDC client's vc policy to the interaction params.
 *
 * For each vc_* parameter the policy mode determines the behaviour:
 *
 * - FIXED:           the entity-configured value is always used (runtime value ignored).
 * - CLIENT_SUPPLIED: the runtime value is used if present, otherwise falls
 *                    back to the entity-configured value.
 *
 * Mutates the params object in place.
 */
export function applyVcPolicy(params: Record<string, unknown>, client: OidcClientEntity): void {
  const policy = client.vcPolicy

  // -- vc_type --
  applyParam(params, ExtraParams.vc_type, policy.vcType, () => client.credentialTypes?.[0] ?? undefined)

  const claimParams = constraintToExtraParams(client.claimConstraint)

  // -- vc_constraint_claim_name -- (always fixed from entity)
  applyParam(params, ExtraParams.vc_constraint_name, VcParamMode.Fixed, () => claimParams.name ?? undefined)
  // -- vc_constraint_operator -- (always fixed from entity)
  applyParam(params, ExtraParams.vc_constraint_operator, VcParamMode.Fixed, () => claimParams.operator ?? undefined)
  // -- vc_constraint_value -- (client-supplied or fixed per policy)
  applyParam(params, ExtraParams.vc_constraint_value, policy.vcConstraintValues, () => claimParams.value ?? undefined)
}

function applyParam(
  params: Record<string, unknown>,
  paramKey: ExtraParams,
  mode: VcParamMode,
  getEntityDefault: () => string | undefined,
): void {
  const runtimeValue = params[paramKey] as string | undefined

  switch (mode) {
    case VcParamMode.Fixed:
      params[paramKey] = getEntityDefault()
      break
    case VcParamMode.ClientSupplied:
    default:
      params[paramKey] = runtimeValue ?? getEntityDefault()
      break
  }
}
