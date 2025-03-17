import type { CommandContext } from '../../../cqs'
import type { ConciergeBrandingInput } from '../../../generated/graphql'
import { CONCIERGE_BRANDING_NAME } from '../constants'
import { BrandingEntity } from '../entities/branding-entity'

export async function CreateOrUpdateConciergeBrandingCommand(this: CommandContext, input: ConciergeBrandingInput) {
  const repo = this.entityManager.getRepository(BrandingEntity)

  const existingBranding = await repo.findOneBy({ name: CONCIERGE_BRANDING_NAME })
  if (existingBranding) {
    existingBranding.data = input.data
    return await repo.save(existingBranding)
  }

  const brandingData = new BrandingEntity({
    name: 'Concierge',
    data: input.data,
  })

  return await repo.save(brandingData)
}
