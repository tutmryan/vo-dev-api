import type { QueryContext } from '../../../cqs'
import { ApplicationLabelConfigEntity } from '../entities/application-label-config-entity'

export async function FindApplicationLabelConfigsQuery(
  this: QueryContext,
  identityStoreId: string,
): Promise<ApplicationLabelConfigEntity[]> {
  return this.entityManager.getRepository(ApplicationLabelConfigEntity).find({
    where: { identityStoreId },
    comment: 'FindApplicationLabelConfigsQuery',
  })
}
