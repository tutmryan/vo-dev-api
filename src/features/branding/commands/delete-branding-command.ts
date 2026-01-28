import type { CommandContext } from '../../../cqs'
import { BrandingEntity } from '../entities/branding-entity'

export async function DeleteBrandingCommand(this: CommandContext, name: string) {
  const repo = this.entityManager.getRepository(BrandingEntity)
  const branding = await repo.findOneBy({ name })

  if (!branding) return

  await repo.remove(branding)
}
