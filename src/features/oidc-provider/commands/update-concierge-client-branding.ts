import type { CommandContext } from '../../../cqs'
import type { ConciergeClientBrandingInput } from '../../../generated/graphql'
import { portalClientId, portalClientName } from '../data'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import { notifyOidcDataChanged } from '../provider'

export async function UpdateConciergeClientBrandingCommand(this: CommandContext, input: ConciergeClientBrandingInput) {
  const repo = this.entityManager.getRepository(OidcClientEntity)
  const client = await repo.findOneByOrFail({ id: portalClientId })

  if (input.name !== undefined) client.name = input.name ?? portalClientName
  if (input.logo !== undefined) client.logo = input.logo ?? null
  if (input.backgroundColor !== undefined) client.backgroundColor = input.backgroundColor ?? null
  if (input.backgroundImage !== undefined) client.backgroundImage = input.backgroundImage ?? null

  const updated = await repo.save(client)
  notifyOidcDataChanged()
  return updated
}
