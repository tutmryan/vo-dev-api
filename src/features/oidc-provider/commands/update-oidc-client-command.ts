import { notifyOidcDataChanged, oidcSecretService } from '..'
import type { CommandContext } from '../../../cqs'
import { OidcApplicationType, OidcTokenEndpointAuthMethod, type OidcClientInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import type { PartnerEntity } from '../../partners/entities/partner-entity'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import { systemClientInvariant, validateClientAuthMethod, validateJarKeys, validateJwksJson } from './utils'

export async function UpdateOidcClientCommand(this: CommandContext, clientId: string, input: OidcClientInput) {
  systemClientInvariant(clientId)

  const { requireFaceCheck, allowAnyPartner, partnerIds, applicationType, relyingPartyJwksUri, clientJwksUri, ...rest } = input

  const repo = this.entityManager.getRepository(OidcClientEntity)
  const client = await repo.findOneByOrFail({ id: clientId })

  const tokenEndpointAuthMethod = validateClientAuthMethod(input)

  const previousAuthMethod = client.tokenEndpointAuthMethod

  // When switching to client_secret_post from a method that didn't have a secret, a new secret is required
  const previousUsedSecret = previousAuthMethod === OidcTokenEndpointAuthMethod.ClientSecretPost
  if (tokenEndpointAuthMethod === OidcTokenEndpointAuthMethod.ClientSecretPost && !previousUsedSecret) {
    invariant(input.clientSecret, 'Confidential clients must have a secret')
  }

  const authorizationRequestsTypeJarEnabled = input.authorizationRequestsTypeJarEnabled ?? false
  const authorizationRequestsTypeStandardEnabled = input.authorizationRequestsTypeStandardEnabled ?? true
  invariant(
    authorizationRequestsTypeJarEnabled || authorizationRequestsTypeStandardEnabled,
    'At least one authorization requests type must be enabled',
  )
  validateJarKeys(input, tokenEndpointAuthMethod)

  // Validate JWKS JSON format
  validateJwksJson(input.clientJwks, 'clientJwks')
  validateJwksJson(input.relyingPartyJwks, 'relyingPartyJwks')

  client.update({
    ...rest,
    applicationType: applicationType ?? OidcApplicationType.Web,
    requireFaceCheck: requireFaceCheck ?? false,
    allowAnyPartner: allowAnyPartner ?? false,
    authorizationRequestsTypeJarEnabled,
    authorizationRequestsTypeStandardEnabled,
    relyingPartyJwks: authorizationRequestsTypeJarEnabled ? (input.relyingPartyJwks ?? null) : null,
    relyingPartyJwksUri: authorizationRequestsTypeJarEnabled ? (relyingPartyJwksUri?.toString() ?? null) : null,
    tokenEndpointAuthMethod,
    clientJwks: tokenEndpointAuthMethod === OidcTokenEndpointAuthMethod.PrivateKeyJwt ? (input.clientJwks ?? null) : null,
    clientJwksUri: tokenEndpointAuthMethod === OidcTokenEndpointAuthMethod.PrivateKeyJwt ? (clientJwksUri?.toString() ?? null) : null,
  })

  if (partnerIds) {
    client.partners = Promise.resolve(partnerIds.map((id) => ({ id }) as PartnerEntity))
  }

  const updated = await repo.save(client)

  // Handle secret storage based on auth method transitions
  if (tokenEndpointAuthMethod === OidcTokenEndpointAuthMethod.ClientSecretPost && input.clientSecret) {
    await oidcSecretService().set(client.id, input.clientSecret)
  } else if (previousUsedSecret && tokenEndpointAuthMethod !== OidcTokenEndpointAuthMethod.ClientSecretPost) {
    // Only delete if there was previously a secret stored (client_secret_post) and we're leaving that method
    await oidcSecretService().delete(client.id)
  }

  notifyOidcDataChanged()
  return updated
}
