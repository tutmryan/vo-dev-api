import { notifyOidcDataChanged, oidcSecretService } from '..'
import type { CommandContext } from '../../../cqs'
import { OidcApplicationType, OidcTokenEndpointAuthMethod, type OidcClientInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import type { PartnerEntity } from '../../partners/entities/partner-entity'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import { validateClientAuthMethod, validateJarKeys, validateJwksJson } from './utils'

export async function CreateOidcClientCommand(this: CommandContext, input: OidcClientInput) {
  const { applicationType, requireFaceCheck, allowAnyPartner, partnerIds, relyingPartyJwksUri, clientJwksUri, ...rest } = input

  const tokenEndpointAuthMethod = validateClientAuthMethod(input)

  if (tokenEndpointAuthMethod === OidcTokenEndpointAuthMethod.ClientSecretPost) {
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

  const repo = this.entityManager.getRepository(OidcClientEntity)
  const client = new OidcClientEntity({
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

  if (partnerIds && partnerIds.length > 0) {
    client.partners = Promise.resolve(partnerIds.map((id) => ({ id }) as PartnerEntity))
  }

  await repo.save(client)

  if (tokenEndpointAuthMethod === OidcTokenEndpointAuthMethod.ClientSecretPost && input.clientSecret) {
    await oidcSecretService().set(client.id, input.clientSecret)
  }

  notifyOidcDataChanged()
  return client
}
