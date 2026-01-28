import type { QueryContext } from '../../../cqs'
import { BrandingEntity } from '../entities/branding-entity'

export async function GetBrandingQuery(this: QueryContext, name: string) {
  return await this.entityManager.getRepository(BrandingEntity).findOneBy({ name })
}
