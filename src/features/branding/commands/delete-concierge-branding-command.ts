import type { CommandContext } from '../../../cqs'
import { CONCIERGE_BRANDING_NAME } from '../constants'
import { BrandingEntity } from '../entities/branding-entity'

export async function DeleteConciergeBrandingCommand(this: CommandContext) {
  const repo = this.entityManager.getRepository(BrandingEntity)

  const branding = await repo.findOneBy({ name: CONCIERGE_BRANDING_NAME })
  if (!branding) return

  await repo.remove(branding)
}
