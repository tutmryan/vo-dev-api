import { notifyOidcDataChanged, oidcSecretService } from '..'
import type { CommandContext } from '../../../cqs'
import { OidcApplicationType, OidcClientType, type OidcClientInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import type { PartnerEntity } from '../../partners/entities/partner-entity'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import { systemClientInvariant } from './utils'

export async function UpdateOidcClientCommand(this: CommandContext, clientId: string, input: OidcClientInput) {
  systemClientInvariant(clientId)

  const { requireFaceCheck, allowAnyPartner, partnerIds, applicationType, relyingPartyJwksUri, ...rest } = input

  const repo = this.entityManager.getRepository(OidcClientEntity)
  const client = await repo.findOneByOrFail({ id: clientId })

  const clientChangedFromConfidentialToPublic =
    client.clientType === OidcClientType.Confidential && input.clientType === OidcClientType.Public
  const clientChangedFromPublicToConfidential =
    client.clientType === OidcClientType.Public && input.clientType === OidcClientType.Confidential

  if (input.clientSecret) invariant(input.clientType === OidcClientType.Confidential, 'Only confidential clients can have a secret')
  if (clientChangedFromPublicToConfidential) invariant(input.clientSecret, 'Confidential clients must have a secret')

  const authorizationRequestsTypeJarEnabled = input.authorizationRequestsTypeJarEnabled ?? false
  const authorizationRequestsTypeStandardEnabled = input.authorizationRequestsTypeStandardEnabled ?? true
  invariant(
    authorizationRequestsTypeJarEnabled || authorizationRequestsTypeStandardEnabled,
    'At least one authorization requests type must be enabled',
  )
  if (authorizationRequestsTypeJarEnabled) invariant(input.relyingPartyJwksUri, 'Relying party JWKS URI is required when JAR is enabled')

  client.update({
    ...rest,
    applicationType: applicationType ?? OidcApplicationType.Web,
    requireFaceCheck: requireFaceCheck ?? false,
    allowAnyPartner: allowAnyPartner ?? false,
    authorizationRequestsTypeJarEnabled,
    authorizationRequestsTypeStandardEnabled,
    relyingPartyJwksUri: relyingPartyJwksUri?.toString(),
  })

  if (partnerIds) {
    client.partners = Promise.resolve(partnerIds.map((id) => ({ id }) as PartnerEntity))
  }

  const updated = await repo.save(client)

  if (input.clientSecret) await oidcSecretService().set(client.id, input.clientSecret)
  else if (clientChangedFromConfidentialToPublic) await oidcSecretService().delete(client.id)

  notifyOidcDataChanged()
  return updated
}
