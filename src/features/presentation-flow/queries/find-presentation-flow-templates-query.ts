import type { QueryContext } from '../../../cqs'
import { PresentationFlowTemplateEntity } from '../entities/presentation-flow-template-entity'

export async function FindPresentationFlowTemplatesQuery(this: QueryContext) {
  return await this.entityManager.getRepository(PresentationFlowTemplateEntity).find({
    comment: 'FindPresentationFlowTemplatesQuery',
    where: { isDeleted: false },
    order: { name: 'ASC' },
  })
}
