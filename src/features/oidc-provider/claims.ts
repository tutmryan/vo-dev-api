import type { Configuration } from 'oidc-provider'

export const presentationLoginStandardClaims = {
  amr: ['vc_authn', 'pop'],
  acr: 'possession',
} as const

export const faceCheckAmr = 'face'

export enum VcInfoClaim {
  Issuer = 'vc_issuer',
  Type = 'vc_type',
  RevocationStatus = 'vc_revocation_status',
}

export enum VcPresentedAttributesClaim {
  PresentedAttributes = 'vc_presented_attributes',
}

export enum OpenIdProfileClaim {
  Name = 'name',
}

export enum VoIdentityClaim {
  IdentityId = 'vc_vo_identity_id',
  IdentityIssuer = 'vc_vo_identity_issuer',
  IdentityIdentifier = 'vc_vo_identity_identifier',
}

export enum VoPresentationClaim {
  PresentationId = 'vc_vo_presentation_id',
  IssuanceId = 'vc_vo_issuance_id',
  FaceCheckMatchConfidenceScore = 'vc_vo_facecheck_match_confidence_score',
}

const standardClaims = Object.keys(presentationLoginStandardClaims).reduce<Record<string, null>>((acc, key) => {
  acc[key] = null
  return acc
}, {}) as Record<keyof typeof presentationLoginStandardClaims, null>

export const openidClaims = {
  ...standardClaims,
  profile: Object.values(OpenIdProfileClaim),
  vc_info: Object.values(VcInfoClaim),
  vc_presented_attributes: Object.values(VcPresentedAttributesClaim),
  vc_vo_presentation: Object.values(VoPresentationClaim),
  vc_vo_identity: Object.values(VoIdentityClaim),
} satisfies Configuration['claims']
