import type { QueryContext } from '../../../cqrs/query-context'
import { TemplateEntity } from '../entities/template-entity'

export async function GetTemplateQuery(this: QueryContext, id: string) {
  return this.entityManager.getRepository(TemplateEntity).findOneOrFail({
    where: { id },
  })
}
