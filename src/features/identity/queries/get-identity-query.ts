import type { QueryContext } from '../../../cqrs/query-context'
import { IdentityEntity } from '../entities/identity-entity'

export async function GetIdentityQuery(this: QueryContext, id: string) {
  return await this.entityManager.getRepository(IdentityEntity).findOneByOrFail({ id })
}
