import type { QueryContext } from '../../../cqs'
import { CONCIERGE_BRANDING_NAME } from '../constants'
import { BrandingEntity } from '../entities/branding-entity'

export async function GetConciergeBrandingQuery(this: QueryContext) {
  const { entityManager } = this

  const conciergeBrandingEntity = await entityManager.getRepository(BrandingEntity).findOneBy({ name: CONCIERGE_BRANDING_NAME })

  return conciergeBrandingEntity
}
