import { notifyOidcDataChanged } from '..'
import type { CommandContext } from '../../../cqs'
import { type OidcClientInput } from '../../../generated/graphql'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import { validateUris } from './utils'

export async function CreateOidcClientCommand(this: CommandContext, input: OidcClientInput) {
  const { redirectUris, postLogoutUris, requireFaceCheck, allowAnyPartner, partnerIds, ...rest } = input

  validateUris('redirect', redirectUris)
  validateUris('log out', postLogoutUris)

  const client = await this.entityManager.getRepository(OidcClientEntity).save(
    new OidcClientEntity({
      ...rest,
      redirectUris,
      postLogoutUris,
      requireFaceCheck: requireFaceCheck ?? false,
      allowAnyPartner: allowAnyPartner ?? false,
      partnerIds: partnerIds ?? [],
    }),
  )

  notifyOidcDataChanged()
  return client
}
