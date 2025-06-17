import type { Configuration } from 'oidc-provider'
import type { OidcClaimMappingEntity } from './entities/oidc-claim-mapping-entity'
import type { OidcResourceEntity } from './entities/oidc-resource-entity'

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
  profile: Object.values(OpenIdProfileClaim),
  vc_info: Object.values(VcInfoClaim),
  vc_presented_attributes: Object.values(VcPresentedAttributesClaim),
  vc_vo_presentation: Object.values(VoPresentationClaim),
  vc_vo_identity: Object.values(VoIdentityClaim),
} satisfies Configuration['claims']

// for the given resources, returns a map of resource indicators to scopes
export const resourceScopes = (resources: OidcResourceEntity[]) =>
  resources.reduce<Record<string, string[]>>((acc, r) => ({ ...acc, [r.resourceIndicator]: r.scopes }), {})

// for the given mappings, returns a single map of claims by scope
export const mappedClaims = (claimMappings: OidcClaimMappingEntity[]) =>
  claimMappings.reduce<Record<string, string[]>>((acc, mapping) => {
    for (const [scope, claims] of Object.entries(mapping.mapping)) {
      if (!acc[scope]) acc[scope] = []
      acc[scope] = [...new Set([...acc[scope], ...Object.keys(claims)])]
    }
    return acc
  }, {})

// for the given claims and set of mappings, returns mapped claims
export function mapClaims(claims: Record<string, any>, claimMappings: OidcClaimMappingEntity[]): Record<string, any> {
  const mapping: Record<string, string> = Object.assign({}, ...claimMappings.flatMap(({ mapping }) => Object.values(mapping)))
  const mapped: Record<string, any> = {}
  for (const [toKey, fromKey] of Object.entries(mapping)) {
    if (claims[fromKey] !== undefined) mapped[toKey] = parseCredentialClaim(toKey, claims[fromKey])
  }
  return mapped
}

function parseCredentialClaim(oidcClaim: string, credentialClaimValue: any): any {
  switch (oidcClaim) {
    case 'email_verified':
      return normalizeBoolean(credentialClaimValue)
    case 'phone_number_verified':
      return normalizeBoolean(credentialClaimValue)
    default:
      return credentialClaimValue
  }
}

function normalizeBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', 'yes', '1', 'on'].includes(normalized)) return true
    if (['false', 'no', '0', 'off'].includes(normalized)) return false
    return Boolean(value)
  }
  return Boolean(value)
}
