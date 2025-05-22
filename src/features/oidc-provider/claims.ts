import type { Configuration } from 'oidc-provider'

export const presentationLoginStandardClaims = {
  amr: ['vc_authn'],
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
  // Temp for Matt Zendesk demo in dev part 3 of 3
  PreferredUsername = 'preferred_username',
}

export enum OpenIdEmailClaim {
  Email = 'email',
  EmailVerified = 'email_verified',
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

export const openidClaims = {
  openid: ['sub', ...Object.keys(presentationLoginStandardClaims)],
  email: Object.values(OpenIdEmailClaim),
  profile: Object.values(OpenIdProfileClaim),
  vc_info: Object.values(VcInfoClaim),
  vc_presented_attributes: Object.values(VcPresentedAttributesClaim),
  vc_vo_presentation: Object.values(VoPresentationClaim),
  vc_vo_identity: Object.values(VoIdentityClaim),
} satisfies Configuration['claims']
