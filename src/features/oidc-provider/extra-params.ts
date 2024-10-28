import type { Configuration } from 'oidc-provider'

export enum ExtraParams {
  vc_type = 'vc_type',
  vc_issuer = 'vc_issuer',
  vc_facecheck = 'vc_facecheck',
  vc_unique_claim_for_sub = 'vc_unique_claim_for_sub',
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
}
