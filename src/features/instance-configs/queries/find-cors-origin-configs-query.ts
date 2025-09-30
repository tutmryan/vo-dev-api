import type { QueryContext } from '../../../cqs'
import { CorsOriginConfigEntity } from '../entities/cors-origins-config-entity'

export async function FindCorsOriginConfigsQuery(this: QueryContext) {
  return this.entityManager.getRepository(CorsOriginConfigEntity).find({
    comment: 'FindCorsOriginConfigsQuery',
  })
}
