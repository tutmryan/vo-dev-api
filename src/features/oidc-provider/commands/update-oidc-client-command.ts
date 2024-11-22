import { notifyOidcDataChanged } from '..'
import type { CommandContext } from '../../../cqs'
import { type OidcClientInput } from '../../../generated/graphql'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import { systemClientInvariant, validateUris } from './utils'

export async function UpdateOidcClientCommand(this: CommandContext, clientId: string, input: OidcClientInput) {
  systemClientInvariant(clientId)

  const { redirectUris, postLogoutUris, requireFaceCheck, allowAnyPartner, partnerIds, ...rest } = input

  validateUris('redirect', redirectUris)
  validateUris('log out', postLogoutUris)

  const repo = this.entityManager.getRepository(OidcClientEntity)
  const client = await repo.findOneByOrFail({ id: clientId })

  client.update({
    ...rest,
    redirectUris,
    postLogoutUris,
    requireFaceCheck: requireFaceCheck ?? false,
    allowAnyPartner: allowAnyPartner ?? false,
    partnerIds: partnerIds ?? [],
  })
  const updated = await repo.save(client)

  notifyOidcDataChanged()
  return updated
}
