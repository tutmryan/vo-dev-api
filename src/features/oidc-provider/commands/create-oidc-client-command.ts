import { notifyOidcDataChanged, oidcSecretService } from '..'
import type { CommandContext } from '../../../cqs'
import { OidcApplicationType, OidcClientType, type OidcClientInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import type { PartnerEntity } from '../../partners/entities/partner-entity'
import { OidcClientEntity } from '../entities/oidc-client-entity'

export async function CreateOidcClientCommand(this: CommandContext, input: OidcClientInput) {
  const { applicationType, requireFaceCheck, allowAnyPartner, partnerIds, ...rest } = input

  if (input.clientType === OidcClientType.Confidential) invariant(input.clientSecret, 'Confidential clients must have a secret')
  if (input.clientSecret) invariant(input.clientType === OidcClientType.Confidential, 'Only confidential clients can have a secret')

  const repo = this.entityManager.getRepository(OidcClientEntity)
  const client = new OidcClientEntity({
    ...rest,
    applicationType: applicationType ?? OidcApplicationType.Web,
    requireFaceCheck: requireFaceCheck ?? false,
    allowAnyPartner: allowAnyPartner ?? false,
  })

  if (partnerIds && partnerIds.length > 0) {
    client.partners = Promise.resolve(partnerIds.map((id) => ({ id }) as PartnerEntity))
  }

  await repo.save(client)

  if (input.clientSecret) await oidcSecretService().set(client.id, input.clientSecret)

  notifyOidcDataChanged()
  return client
}
