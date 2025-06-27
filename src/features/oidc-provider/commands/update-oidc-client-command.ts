import { notifyOidcDataChanged, oidcSecretService } from '..'
import type { CommandContext } from '../../../cqs'
import { OidcApplicationType, OidcClientType, type OidcClientInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import { systemClientInvariant } from './utils'

export async function UpdateOidcClientCommand(this: CommandContext, clientId: string, input: OidcClientInput) {
  systemClientInvariant(clientId)

  const { requireFaceCheck, allowAnyPartner, partnerIds, applicationType, ...rest } = input

  const repo = this.entityManager.getRepository(OidcClientEntity)
  const client = await repo.findOneByOrFail({ id: clientId })

  const clientChangedFromConfidentialToPublic =
    client.clientType === OidcClientType.Confidential && input.clientType === OidcClientType.Public
  const clientChangedFromPublicToConfidential =
    client.clientType === OidcClientType.Public && input.clientType === OidcClientType.Confidential

  if (input.clientSecret) invariant(input.clientType === OidcClientType.Confidential, 'Only confidential clients can have a secret')
  if (clientChangedFromPublicToConfidential) invariant(input.clientSecret, 'Confidential clients must have a secret')

  client.update({
    ...rest,
    applicationType: applicationType ?? OidcApplicationType.Web,
    requireFaceCheck: requireFaceCheck ?? false,
    allowAnyPartner: allowAnyPartner ?? false,
    partnerIds: partnerIds ?? [],
  })
  const updated = await repo.save(client)

  if (input.clientSecret) await oidcSecretService().setClientSecret(client.id, input.clientSecret)
  else if (clientChangedFromConfidentialToPublic) await oidcSecretService().deleteClientSecret(client.id)

  notifyOidcDataChanged()
  return updated
}
