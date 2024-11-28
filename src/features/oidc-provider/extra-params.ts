import type { Configuration } from 'oidc-provider'

export enum ExtraParams {
  vc_type = 'vc_type',
  vc_issuer = 'vc_issuer',
  vc_facecheck = 'vc_facecheck',
  vc_unique_claim_for_sub = 'vc_unique_claim_for_sub',
  vc_constraint_name = 'vc_constraint_name',
  vc_constraint_operator = 'vc_constraint_operator',
  vc_constraint_value = 'vc_constraint_value',
}

export const extraParams: Configuration['extraParams'] = {
  async [ExtraParams.vc_type](ctx, value, _client) {
    if (ctx.oidc.params) ctx.oidc.params[ExtraParams.vc_type] = value
  },
  async [ExtraParams.vc_issuer](ctx, value, _client) {
    if (ctx.oidc.params) ctx.oidc.params[ExtraParams.vc_issuer] = value
  },
  async [ExtraParams.vc_facecheck](ctx, value, _client) {
    if (ctx.oidc.params) ctx.oidc.params[ExtraParams.vc_facecheck] = value
  },
  async [ExtraParams.vc_unique_claim_for_sub](ctx, value, _client) {
    if (ctx.oidc.params) ctx.oidc.params[ExtraParams.vc_unique_claim_for_sub] = value
  },
  async [ExtraParams.vc_constraint_name](ctx, value, _client) {
    if (ctx.oidc.params) ctx.oidc.params[ExtraParams.vc_constraint_name] = value
  },
  async [ExtraParams.vc_constraint_operator](ctx, value, _client) {
    if (ctx.oidc.params) ctx.oidc.params[ExtraParams.vc_constraint_operator] = value
  },
  async [ExtraParams.vc_constraint_value](ctx, value, _client) {
    if (ctx.oidc.params) ctx.oidc.params[ExtraParams.vc_constraint_value] = value
  },
}
