import { OidcClientType, OidcTokenEndpointAuthMethod, type OidcClientInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { apiResourceId, portalClientId } from '../data'

export function systemClientInvariant(clientId: string) {
  invariant(clientId !== portalClientId, 'The portal client cannot be modified')
}

export function systemResourceInvariant(resourceId: string) {
  invariant(resourceId !== apiResourceId, 'The API resource cannot be modified')
}

export function validateClientAuthMethod(input: OidcClientInput): OidcTokenEndpointAuthMethod {
  const authMethod =
    input.tokenEndpointAuthMethod ??
    (input.clientType === OidcClientType.Confidential ? OidcTokenEndpointAuthMethod.ClientSecretPost : OidcTokenEndpointAuthMethod.None)

  // JWKS JSON vs URI mutual exclusivity
  invariant(!(input.clientJwks && input.clientJwksUri), 'clientJwks and clientJwksUri are mutually exclusive')
  invariant(!(input.relyingPartyJwks && input.relyingPartyJwksUri), 'relyingPartyJwks and relyingPartyJwksUri are mutually exclusive')

  if (input.clientType === OidcClientType.Public) {
    invariant(authMethod === OidcTokenEndpointAuthMethod.None, 'Public clients must use token endpoint auth method "none"')
    invariant(!input.clientSecret, 'Public clients cannot have a secret')
    invariant(!input.clientJwks && !input.clientJwksUri, 'Public clients cannot have JWKS')
  }

  if (authMethod === OidcTokenEndpointAuthMethod.ClientSecretPost) {
    invariant(input.clientType === OidcClientType.Confidential, 'Only confidential clients can use client_secret_post')
    invariant(!input.clientJwks && !input.clientJwksUri, 'client_secret_post clients cannot have JWKS, use private_key_jwt instead')
  }

  if (authMethod === OidcTokenEndpointAuthMethod.PrivateKeyJwt) {
    invariant(input.clientType === OidcClientType.Confidential, 'Only confidential clients can use private_key_jwt')
    invariant(input.clientJwks || input.clientJwksUri, 'private_key_jwt clients must have clientJwks or clientJwksUri')
    invariant(!input.clientSecret, 'private_key_jwt clients cannot have a secret, use client_secret_post instead')
  }

  return authMethod
}

export function validateJarKeys(input: OidcClientInput, authMethod: OidcTokenEndpointAuthMethod): void {
  const jarEnabled = input.authorizationRequestsTypeJarEnabled ?? false
  if (!jarEnabled) return

  // When using client_secret_post, HS-signed request objects work via the symmetric keystore — no asymmetric JAR keys required
  if (authMethod === OidcTokenEndpointAuthMethod.ClientSecretPost) return

  invariant(
    input.relyingPartyJwks || input.relyingPartyJwksUri,
    'JAR-enabled clients must have relyingPartyJwks or relyingPartyJwksUri (unless using client_secret_post)',
  )
}

export function validateJwksJson(jwks: unknown | null | undefined, fieldName: string): void {
  if (!jwks) return

  // Validate it's either a single JWK or a JWKS with keys array
  if (typeof jwks === 'object' && !Array.isArray(jwks)) {
    const obj = jwks as Record<string, unknown>
    if (!obj.kty && !obj.keys) {
      invariant(false, `${fieldName} must be valid JSON containing a JWK or JWKS object`)
    }
  } else {
    invariant(false, `${fieldName} must be valid JSON containing a JWK or JWKS object`)
  }
}
