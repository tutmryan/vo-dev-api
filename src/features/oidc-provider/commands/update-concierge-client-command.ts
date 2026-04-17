import type { ConciergeClientInput } from '@/generated/graphql'
import type { CommandContext } from '../../../cqs'
import { portalClientId, portalClientName } from '../data'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import { notifyOidcDataChanged } from '../provider'

export async function UpdateConciergeClientCommand(this: CommandContext, input: ConciergeClientInput) {
  const repo = this.entityManager.getRepository(OidcClientEntity)
  const client = await repo.findOneByOrFail({ id: portalClientId })

  // Branding fields
  if (input.name !== undefined) client.name = input.name ?? portalClientName
  if (input.logo !== undefined) client.logo = input.logo ?? null
  if (input.backgroundColor !== undefined) client.backgroundColor = input.backgroundColor ?? null
  if (input.backgroundImage !== undefined) client.backgroundImage = input.backgroundImage ?? null

  const updated = await repo.save(client)
  notifyOidcDataChanged()
  return updated
}
