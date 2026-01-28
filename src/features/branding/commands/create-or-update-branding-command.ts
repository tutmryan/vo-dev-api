import type { CommandContext } from '../../../cqs'
import { BrandingEntity } from '../entities/branding-entity'

export interface BrandingInput {
  data: Record<string, unknown>
}

export async function CreateOrUpdateBrandingCommand(this: CommandContext, name: string, input: BrandingInput) {
  const repo = this.entityManager.getRepository(BrandingEntity)

  const existingBranding = await repo.findOneBy({ name })
  if (existingBranding) {
    existingBranding.data = input.data
    return await repo.save(existingBranding)
  }

  const brandingData = new BrandingEntity({
    name,
    data: input.data,
  })

  return await repo.save(brandingData)
}
