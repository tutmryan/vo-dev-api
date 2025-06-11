import { randomUUID } from 'node:crypto'
import type { Configuration } from 'oidc-provider'
import { instance } from '../../config'
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

// for the given resources, returns a map of resource indicators to scopes
export const resourceScopes = (resources: OidcResourceEntity[]) =>
  resources.reduce<Record<string, string[]>>((acc, r) => ({ ...acc, [r.resourceIndicator]: r.scopes }), {})

export type ClaimMapping = {
  id: string
  name: string
  clientIds: string[]
  scopeMappings: Record<string, Record<string, string>>
}

// for the given mappings, returns a single map of claims by scope
export const mappedClaims = (claimMappings: ClaimMapping[]) =>
  claimMappings.reduce<Record<string, string[]>>((acc, mapping) => {
    for (const [scope, claims] of Object.entries(mapping.scopeMappings)) {
      if (!acc[scope]) acc[scope] = []
      acc[scope] = [...new Set([...acc[scope], ...Object.keys(claims)])]
    }
    return acc
  }, {})

// for the given claims and set of mappings, returns mapped claims
export function mapClaims(claims: Record<string, any>, claimMappings: ClaimMapping[]): Record<string, any> {
  const mapping: Record<string, string> = Object.assign({}, ...claimMappings.flatMap(({ scopeMappings }) => Object.values(scopeMappings)))
  const mapped: Record<string, any> = {}
  for (const [toKey, fromKey] of Object.entries(mapping)) {
    if (claims[fromKey] !== undefined) mapped[toKey] = claims[fromKey]
  }
  return mapped
}

// Temp for Matt 'Friendly Super' demo
export const staticDemoClaimMappings: ClaimMapping[] =
  instance === 'dev'
    ? [
        {
          id: randomUUID(),
          name: `Matt's demo mapping`,
          clientIds: ['1b123dea-3c0b-48ee-848b-b499bc482ab0'],
          scopeMappings: {
            member: {
              member_id: 'member_id',
            },
            phone: {
              phone_number: 'mobile_phone',
            },
            profile: {
              preferred_username: 'email',
              given_name: 'first_name',
              middle_name: 'middle_name',
              family_name: 'surname',
            },
            address: {
              country: 'country',
              street_address: 'street_address',
              unit_number: 'unit_number',
              street_number: 'street_number',
              street_type: 'street_type',
              suburb: 'suburb',
              state: 'state',
              postcode: 'postcode',
            },
            bank: {
              bank_name: 'bank_name',
              bank_account_name: 'account_name',
              bank_account_bsb: 'bsb',
              bank_account_number: 'bank_account_number',
            },
          },
        },
      ]
    : []
