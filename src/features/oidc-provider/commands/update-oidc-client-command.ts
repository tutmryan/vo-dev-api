import { notifyOidcDataChanged } from '..'
import type { CommandContext } from '../../../cqs'
import { type OidcClientInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import { systemClientInvariant } from './utils'

export async function UpdateOidcClientCommand(this: CommandContext, clientId: string, input: OidcClientInput) {
  systemClientInvariant(clientId)

  const { redirectUris, allowAnyPartner, partnerIds, ...rest } = input
  invariant(redirectUris.length > 0, 'At least one redirect URI is required')

  const repo = this.entityManager.getRepository(OidcClientEntity)
  const client = await repo.findOneByOrFail({ id: clientId })

  client.update({
    ...rest,
    redirectUris,
    allowAnyPartner: allowAnyPartner ?? false,
    partnerIds: partnerIds ?? [],
  })
  const updated = await repo.save(client)

  notifyOidcDataChanged()
  return updated
}
