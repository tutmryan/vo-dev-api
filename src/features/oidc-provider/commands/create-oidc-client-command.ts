import { notifyOidcDataChanged, oidcSecretService } from '..'
import type { CommandContext } from '../../../cqs'
import { OidcApplicationType, OidcClientType, type OidcClientInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { OidcClientEntity } from '../entities/oidc-client-entity'

export async function CreateOidcClientCommand(this: CommandContext, input: OidcClientInput) {
  const { applicationType, requireFaceCheck, allowAnyPartner, partnerIds, ...rest } = input

  if (input.clientType === OidcClientType.Confidential) invariant(input.clientSecret, 'Confidential clients must have a secret')
  if (input.clientSecret) invariant(input.clientType === OidcClientType.Confidential, 'Only confidential clients can have a secret')

  const client = await this.entityManager.getRepository(OidcClientEntity).save(
    new OidcClientEntity({
      ...rest,
      applicationType: applicationType ?? OidcApplicationType.Web,
      requireFaceCheck: requireFaceCheck ?? false,
      allowAnyPartner: allowAnyPartner ?? false,
      partnerIds: partnerIds ?? [],
    }),
  )

  if (input.clientSecret) await oidcSecretService().set(client.id, input.clientSecret)

  notifyOidcDataChanged()
  return client
}
