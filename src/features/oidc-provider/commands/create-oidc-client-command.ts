import { notifyOidcDataChanged } from '..'
import type { CommandContext } from '../../../cqs'
import { type OidcClientInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { OidcClientEntity } from '../entities/oidc-client-entity'

export async function CreateOidcClientCommand(this: CommandContext, input: OidcClientInput) {
  const { redirectUris, allowAnyPartner, partnerIds, ...rest } = input

  invariant(redirectUris.length > 0, 'At least one redirect URI is required')

  const client = await this.entityManager.getRepository(OidcClientEntity).save(
    new OidcClientEntity({
      ...rest,
      redirectUris,
      allowAnyPartner: allowAnyPartner ?? false,
      partnerIds: partnerIds ?? [],
    }),
  )

  notifyOidcDataChanged()
  return client
}
